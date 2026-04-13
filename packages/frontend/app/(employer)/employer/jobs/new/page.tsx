'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToastStore } from '@/lib/store';
import api, { extractError } from '@/lib/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { cn } from '@/lib/utils';
import { Bold, Italic, List, ListOrdered, ArrowLeft } from 'lucide-react';

const GHANA_REGIONS = ['Greater Accra', 'Ashanti', 'Northern', 'Eastern', 'Western', 'Volta', 'Central', 'Brong-Ahafo', 'Upper East', 'Upper West', 'Savannah', 'Bono East', 'Ahafo', 'North East', 'Western North', 'Oti'];

const schema = z.object({
  title: z.string().min(3, 'Job title required'),
  department: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED']),
  location: z.string().min(2, 'Location required'),
  region: z.string().min(1, 'Region required'),
  remoteEligible: z.boolean().default(false),
  requiredSkills: z.array(z.string()).min(1, 'Add at least one skill'),
  minExperienceYears: z.coerce.number().min(0).max(20),
  minEducationLevel: z.string().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  applicationDeadline: z.string().optional(),
  numberOfOpenings: z.coerce.number().min(1).max(50),
  publishNow: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export default function NewJobPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { numberOfOpenings: 1, minExperienceYears: 0, publishNow: false, remoteEligible: false, requiredSkills: [] },
  });

  // Load skills taxonomy
  useEffect(() => {
    api.get('/applicants/skills').then(({ data }) => {
      setAvailableSkills((data.data ?? []).map((s: { name: string }) => s.name));
    }).catch(() => {});
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Describe the role, responsibilities, and requirements (max 3000 characters)...' }),
      CharacterCount.configure({ limit: 3000 }),
    ],
  });

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const onSubmit = async (data: FormData) => {
    const description = editor?.getHTML() ?? '';
    if (!description || description === '<p></p>') {
      addToast({ type: 'error', title: 'Job description is required.' });
      return;
    }
    if (skills.length === 0) {
      addToast({ type: 'error', title: 'Add at least one required skill.' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...data, description, requiredSkills: skills };
      const { data: res } = await api.post('/jobs', payload);

      if (data.publishNow) {
        await api.patch(`/jobs/${res.data.id}/status`, { status: 'ACTIVE' });
      }

      addToast({ type: 'success', title: 'Job created!', description: data.publishNow ? 'Your job is now live.' : 'Saved as draft.' });
      router.push('/employer/jobs');
    } catch (err) {
      addToast({ type: 'error', title: 'Save failed', description: extractError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Job Title *</Label>
                <Input {...register('title')} placeholder="e.g. Senior Media Sales Executive" className="mt-1" />
                {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label>Department</Label>
                <Input {...register('department')} placeholder="e.g. Sales & Marketing" className="mt-1" />
              </div>
              <div>
                <Label>Job Type *</Label>
                <select {...register('jobType')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="COMMISSION_BASED">Commission-Based</option>
                </select>
                {errors.jobType && <p className="text-destructive text-xs mt-1">{errors.jobType.message}</p>}
              </div>
              <div>
                <Label>Location *</Label>
                <Input {...register('location')} placeholder="e.g. Accra, Airport Residential" className="mt-1" />
                {errors.location && <p className="text-destructive text-xs mt-1">{errors.location.message}</p>}
              </div>
              <div>
                <Label>Region *</Label>
                <select {...register('region')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select region...</option>
                  {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.region && <p className="text-destructive text-xs mt-1">{errors.region.message}</p>}
              </div>
              <div>
                <Label>Number of Openings</Label>
                <Input type="number" {...register('numberOfOpenings')} min={1} max={50} className="mt-1" />
              </div>
              <div>
                <Label>Application Deadline</Label>
                <Input type="date" {...register('applicationDeadline')} className="mt-1" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('remoteEligible')} className="rounded" />
              Remote eligible (applicants from other regions may apply)
            </label>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Job Description *</CardTitle>
              <span className="text-xs text-muted-foreground">{editor?.storage.characterCount.characters() ?? 0}/3000</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mini toolbar */}
            <div className="flex gap-1 mb-2 border-b pb-2">
              {[
                { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), isActive: editor?.isActive('bold') },
                { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), isActive: editor?.isActive('italic') },
                { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), isActive: editor?.isActive('bulletList') },
                { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), isActive: editor?.isActive('orderedList') },
              ].map(({ icon: Icon, action, isActive }, i) => (
                <button key={i} type="button" onClick={action}
                  className={cn('p-1.5 rounded text-sm transition-colors', isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="border rounded-md min-h-[200px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <EditorContent editor={editor} />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader><CardTitle className="text-base">Required Skills *</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Type a skill and press Enter"
                list="skills-list"
              />
              <datalist id="skills-list">
                {availableSkills.map((s) => <option key={s} value={s} />)}
              </datalist>
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(s)}>
                  {s} ×
                </Badge>
              ))}
            </div>
            {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
          </CardContent>
        </Card>

        {/* Requirements & Salary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Requirements &amp; Compensation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Min Experience (years)</Label>
                <Input type="number" {...register('minExperienceYears')} min={0} className="mt-1" />
              </div>
              <div>
                <Label>Min Salary (GHC/month)</Label>
                <Input type="number" {...register('salaryMin')} placeholder="Optional" className="mt-1" />
              </div>
              <div>
                <Label>Max Salary (GHC/month)</Label>
                <Input type="number" {...register('salaryMax')} placeholder="Optional" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Minimum Education Level</Label>
              <select {...register('minEducationLevel')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">No specific requirement</option>
                <option value="SSCE/WASSCE">SSCE/WASSCE</option>
                <option value="HND">HND</option>
                <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                <option value="Master's Degree">Master&apos;s Degree</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('publishNow')} className="rounded" />
            Publish immediately (otherwise saved as draft)
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Job</Button>
        </div>
      </form>
    </div>
  );
}
