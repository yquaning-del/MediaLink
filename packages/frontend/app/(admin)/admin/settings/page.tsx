'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api, { extractError } from '@/lib/api';
import { MOCK_ADMIN_CONFIGS, MOCK_ADMIN_SKILLS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { Settings, Plus, X } from 'lucide-react';

interface Config { key: string; value: string }
interface Skill { id: string; name: string; category: string; active: boolean }

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  DEFAULT_REVENUE_SHARE_RATE: 'Revenue share rate (decimal, e.g. 0.05 = 5%)',
  REVENUE_SHARE_MONTHS: 'Number of months for revenue share obligations',
  REGISTRATION_FEE_GHC: 'Applicant registration fee in GHC',
  PROFILE_VISIBILITY_THRESHOLD: 'Minimum profile completion % to appear in searches',
  JOB_MATCH_THRESHOLD: 'Minimum match score % to trigger job match notifications',
};

export default function PlatformSettingsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: '' });
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/admin/config'), api.get('/applicants/skills')]).then(([cfgRes, skillRes]) => {
      setConfigs(cfgRes.data.data ?? []);
      setSkills(skillRes.data.data ?? []);
    }).catch(() => { setConfigs(MOCK_ADMIN_CONFIGS); setSkills(MOCK_ADMIN_SKILLS); }).finally(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    setSaving(true);
    try {
      await api.put('/admin/config', { key: editingConfig.key, value: newValue });
      setConfigs((prev) => prev.map((c) => c.key === editingConfig.key ? { ...c, value: newValue } : c));
      addToast({ type: 'success', title: 'Config updated.' });
      setEditingConfig(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Update failed', description: extractError(err) });
    } finally { setSaving(false); }
  };

  const handleAddSkill = async () => {
    setAddingSkill(true);
    try {
      await api.post('/admin/skills', { action: 'ADD', skillName: newSkill.name, category: newSkill.category });
      addToast({ type: 'success', title: `Skill "${newSkill.name}" added.` });
      setAddSkillOpen(false);
      setNewSkill({ name: '', category: '' });
      const { data } = await api.get('/applicants/skills');
      setSkills(data.data ?? []);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed', description: extractError(err) });
    } finally { setAddingSkill(false); }
  };

  const handleDeactivateSkill = async (name: string) => {
    try {
      await api.post('/admin/skills', { action: 'DEACTIVATE', skillName: name });
      setSkills((prev) => prev.map((s) => s.name === name ? { ...s, active: false } : s));
      addToast({ type: 'success', title: `Skill "${name}" deactivated.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed', description: extractError(err) });
    }
  };

  const groupedSkills = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    acc[s.category] = [...(acc[s.category] ?? []), s];
    return acc;
  }, {});

  if (loading) return <div className="p-6 flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Platform Settings</h1>
      </div>

      {/* Platform Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Configuration</CardTitle>
          <CardDescription>Core settings that control platform behaviour. Changes take effect immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configs.map((c) => (
            <div key={c.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium">{c.key}</p>
                {CONFIG_DESCRIPTIONS[c.key] && <p className="text-xs text-muted-foreground mt-0.5">{CONFIG_DESCRIPTIONS[c.key]}</p>}
              </div>
              <div className="flex items-center gap-3 ml-4">
                <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">{c.value}</code>
                <Button size="sm" variant="outline" className="h-7" onClick={() => { setEditingConfig(c); setNewValue(c.value); }}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills Taxonomy */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Skills Taxonomy</CardTitle>
              <CardDescription>{skills.filter((s) => s.active).length} active skills across {Object.keys(groupedSkills).length} categories</CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddSkillOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Skill</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedSkills).map(([category, catSkills]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {catSkills.map((s) => (
                  <div key={s.name} className="flex items-center gap-1">
                    <Badge variant={s.active ? 'secondary' : 'outline'} className={s.active ? '' : 'opacity-50 line-through'}>
                      {s.name}
                    </Badge>
                    {s.active && (
                      <button onClick={() => handleDeactivateSkill(s.name)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Config Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editingConfig?.key}</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>Value</Label>
            <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} className="mt-1 font-mono" />
            {editingConfig && CONFIG_DESCRIPTIONS[editingConfig.key] && (
              <p className="text-xs text-muted-foreground mt-1">{CONFIG_DESCRIPTIONS[editingConfig.key]}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>Cancel</Button>
            <Button onClick={handleSaveConfig} loading={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Skill</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Skill Name</Label>
              <Input value={newSkill.name} onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. LinkedIn Advertising" className="mt-1" />
            </div>
            <div>
              <Label>Category</Label>
              <select value={newSkill.category} onChange={(e) => setNewSkill((p) => ({ ...p, category: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select category...</option>
                <option value="Sales">Sales</option>
                <option value="Advertising">Advertising</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSkillOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSkill} loading={addingSkill} disabled={!newSkill.name || !newSkill.category}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
