'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToastStore } from '@/lib/store';
import api, { extractError } from '@/lib/api';
import { CheckCircle, ChevronRight, ChevronLeft, Plus, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Northern', 'Eastern', 'Western',
  'Volta', 'Central', 'Brong-Ahafo', 'Upper East', 'Upper West',
  'Savannah', 'Bono East', 'Ahafo', 'North East', 'Western North', 'Oti',
];

const SKILLS = [
  'Cold Calling', 'Consultative Selling', 'B2B Sales', 'B2C Sales', 'Account Management',
  'Lead Generation', 'Pipeline Management', 'Upselling & Cross-Selling', 'Sales Presentations',
  'CRM Software (Salesforce)', 'CRM Software (HubSpot)', 'CRM Software (Zoho)',
  'Media Planning', 'Ad Trafficking', 'Programmatic Advertising', 'Google Ads',
  'Facebook/Meta Ads', 'Out-of-Home (OOH) Advertising', 'Radio Ad Sales', 'TV Airtime Sales',
  'Sponsorship Sales', 'Event Marketing', 'SEO', 'SEM', 'Content Marketing',
  'Social Media Management', 'Email Marketing', 'Influencer Marketing',
  'Analytics (Google Analytics)', 'Analytics (Data Studio)',
  'Negotiation', 'Client Relationship Management', 'Communication', 'Presentation',
  'Teamwork', 'Time Management', 'Problem Solving',
];

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED'];
const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-Time', PART_TIME: 'Part-Time', CONTRACT: 'Contract', COMMISSION_BASED: 'Commission-Based',
};

const STEPS = ['Personal Info', 'Professional Summary', 'Work Experience', 'Education', 'Skills & Preferences'];

const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  ghanaCardNumber: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  region: z.string().optional(),
  professionalSummary: z.string().min(200, 'Minimum 200 characters').max(500, 'Maximum 500 characters').optional().or(z.literal('')),
  skills: z.array(z.string()).min(3, 'Select at least 3 skills'),
  preferredJobTypes: z.array(z.string()),
  preferredRegions: z.array(z.string()),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  workExperiences: z.array(z.object({
    companyName: z.string().min(1, 'Company name required'),
    role: z.string().min(1, 'Role required'),
    startDate: z.string().min(1, 'Start date required'),
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
    responsibilities: z.string().optional(),
  })),
  educations: z.array(z.object({
    institution: z.string().min(1, 'Institution required'),
    qualification: z.string().min(1, 'Qualification required'),
    graduationYear: z.coerce.number().min(1950).max(2030),
  })),
});

type FormData = z.infer<typeof schema>;

export default function ProfileBuilderPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { skills: [], preferredJobTypes: [], preferredRegions: [], workExperiences: [], educations: [] },
  });

  const skills = watch('skills') ?? [];
  const preferredJobTypes = watch('preferredJobTypes') ?? [];
  const preferredRegions = watch('preferredRegions') ?? [];
  const workExperiences = watch('workExperiences') ?? [];
  const educations = watch('educations') ?? [];
  const summary = watch('professionalSummary') ?? '';

  const toggleArrayValue = (field: 'skills' | 'preferredJobTypes' | 'preferredRegions', value: string) => {
    const current: string[] = getValues(field) ?? [];
    setValue(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  const addWorkExp = () => setValue('workExperiences', [...workExperiences, { companyName: '', role: '', startDate: '', isCurrent: false }]);
  const removeWorkExp = (i: number) => setValue('workExperiences', workExperiences.filter((_, idx) => idx !== i));
  const addEducation = () => setValue('educations', [...educations, { institution: '', qualification: '', graduationYear: 2020 }]);
  const removeEducation = (i: number) => setValue('educations', educations.filter((_, idx) => idx !== i));

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // 1. Save profile data
      await api.put('/applicants/profile', data);

      // 2. Upload photo if selected
      if (photoFile) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await api.post('/applicants/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      // 3. Upload CV if selected
      if (cvFile) {
        const fd = new FormData();
        fd.append('cv', cvFile);
        await api.post('/applicants/profile/cv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      addToast({ type: 'success', title: 'Profile saved!', description: 'Your profile is now live.' });
      router.push('/applicant/dashboard');
    } catch (err) {
      addToast({ type: 'error', title: 'Save failed', description: extractError(err) });
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Build Your Profile</h1>
        <p className="text-muted-foreground text-sm mb-4">Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong></p>
        <Progress value={progress} className="h-2" />
        <div className="flex mt-2">
          {STEPS.map((s, i) => (
            <div key={s} className={cn('flex-1 text-center text-xs pt-1', i <= step ? 'text-primary font-medium' : 'text-muted-foreground')}>
              {i < step && <CheckCircle className="h-3 w-3 inline mr-1" />}
              <span className="hidden sm:inline">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0 — Personal Info */}
        {step === 0 && (
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input {...register('fullName')} placeholder="Kwame Mensah" className="mt-1" />
                  {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register('dateOfBirth')} className="mt-1" />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select {...register('gender')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <Label>Ghana Card Number</Label>
                  <Input {...register('ghanaCardNumber')} placeholder="GHA-XXXXXXXXX-X" className="mt-1" />
                </div>
                <div>
                  <Label>Region</Label>
                  <select {...register('region')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select region...</option>
                    {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <Label>District</Label>
                  <Input {...register('district')} placeholder="e.g. Accra Metropolitan" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Residential Address</Label>
                <Input {...register('address')} placeholder="House No., Street, City" className="mt-1" />
              </div>

              {/* Photo Upload */}
              <div>
                <Label>Profile Photo (JPG/PNG, max 2MB)</Label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-muted-foreground/50 cursor-pointer hover:border-primary text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Upload className="h-4 w-4" />
                    {photoFile ? photoFile.name : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </div>

              {/* CV Upload */}
              <div>
                <Label>CV / Résumé (PDF/DOCX, max 5MB)</Label>
                <div className="mt-1">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-muted-foreground/50 cursor-pointer hover:border-primary text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
                    <Upload className="h-4 w-4" />
                    {cvFile ? cvFile.name : 'Upload CV'}
                    <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1 — Professional Summary */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Professional Summary</CardTitle></CardHeader>
            <CardContent>
              <Label>Summary <span className="text-muted-foreground text-xs">(200–500 characters)</span></Label>
              <Textarea
                {...register('professionalSummary')}
                placeholder="Write a brief professional summary highlighting your media sales experience, key achievements, and what you bring to the table..."
                className="mt-1 min-h-[160px]"
                maxLength={500}
              />
              <p className={cn('text-xs mt-1 text-right', summary.length < 200 ? 'text-red-500' : 'text-muted-foreground')}>
                {summary.length}/500 {summary.length < 200 && `(need ${200 - summary.length} more)`}
              </p>
              {errors.professionalSummary && <p className="text-destructive text-xs mt-1">{errors.professionalSummary.message}</p>}
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Work Experience */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Work Experience</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addWorkExp}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {workExperiences.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No work experience added yet. Click &quot;Add&quot; to get started.</p>
              )}
              {workExperiences.map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                  <button type="button" onClick={() => removeWorkExp(i)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Company Name *</Label>
                      <Input {...register(`workExperiences.${i}.companyName`)} placeholder="Joy Media Ltd" className="mt-1" />
                    </div>
                    <div>
                      <Label>Your Role *</Label>
                      <Input {...register(`workExperiences.${i}.role`)} placeholder="Media Sales Executive" className="mt-1" />
                    </div>
                    <div>
                      <Label>Start Date *</Label>
                      <Input type="date" {...register(`workExperiences.${i}.startDate`)} className="mt-1" />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" {...register(`workExperiences.${i}.endDate`)} className="mt-1" disabled={watch(`workExperiences.${i}.isCurrent`)} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register(`workExperiences.${i}.isCurrent`)} className="rounded" />
                    I currently work here
                  </label>
                  <div>
                    <Label>Key Responsibilities</Label>
                    <Textarea {...register(`workExperiences.${i}.responsibilities`)} placeholder="Describe your main duties and achievements..." className="mt-1" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Education */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Education</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {educations.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No education added yet. Click &quot;Add&quot; to get started.</p>
              )}
              {educations.map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                  <button type="button" onClick={() => removeEducation(i)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label>Institution *</Label>
                      <Input {...register(`educations.${i}.institution`)} placeholder="University of Ghana" className="mt-1" />
                    </div>
                    <div>
                      <Label>Graduation Year *</Label>
                      <Input type="number" {...register(`educations.${i}.graduationYear`)} placeholder="2020" className="mt-1" />
                    </div>
                    <div className="sm:col-span-3">
                      <Label>Qualification *</Label>
                      <Input {...register(`educations.${i}.qualification`)} placeholder="BSc Marketing" className="mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 4 — Skills & Preferences */}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle>Skills &amp; Job Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Skills <span className="text-muted-foreground text-xs">(select at least 3)</span></Label>
                {errors.skills && <p className="text-destructive text-xs mt-1">{errors.skills.message}</p>}
                <div className="mt-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {SKILLS.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => toggleArrayValue('skills', s)}
                      className={cn('px-3 py-1 rounded-full text-xs border transition-colors', skills.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-primary text-muted-foreground hover:text-foreground')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{skills.length} selected</p>
              </div>

              <div>
                <Label>Preferred Job Types</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {JOB_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => toggleArrayValue('preferredJobTypes', t)}
                      className={cn('px-3 py-1 rounded-full text-xs border transition-colors', preferredJobTypes.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-primary')}
                    >
                      {JOB_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Preferred Regions</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GHANA_REGIONS.map((r) => (
                    <button
                      key={r} type="button"
                      onClick={() => toggleArrayValue('preferredRegions', r)}
                      className={cn('px-3 py-1 rounded-full text-xs border transition-colors', preferredRegions.includes(r) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-primary')}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Salary (GHC/month)</Label>
                  <Input type="number" {...register('salaryMin')} placeholder="e.g. 2000" className="mt-1" />
                </div>
                <div>
                  <Label>Max Salary (GHC/month)</Label>
                  <Input type="number" {...register('salaryMax')} placeholder="e.g. 5000" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" loading={saving}>
              Save Profile
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
