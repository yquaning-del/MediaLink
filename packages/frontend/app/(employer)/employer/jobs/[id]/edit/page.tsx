'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import api, { extractError } from '@/lib/api';
import { useToastStore } from '@/lib/store';

const schema = z.object({
  title: z.string().min(3).max(150),
  department: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED']),
  location: z.string().min(2),
  region: z.string().min(2),
  remoteEligible: z.boolean(),
  requiredSkills: z.array(z.object({ skill: z.string().min(1) })).min(1),
  minExperienceYears: z.coerce.number().min(0).max(30),
  minEducationLevel: z.string().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  numberOfOpenings: z.coerce.number().min(1).max(100),
  applicationDeadline: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SKILL_SUGGESTIONS = ['Sales', 'Media Planning', 'Client Relations', 'Digital Advertising', 'Radio Sales', 'TV Advertising', 'Outdoor Media', 'Content Marketing', 'Social Media', 'Negotiation'];

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { remoteEligible: false, requiredSkills: [{ skill: '' }], minExperienceYears: 0, numberOfOpenings: 1 },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'requiredSkills' });

  const editor = useEditor({
    extensions: [StarterKit, CharacterCount.configure({ limit: 3000 })],
    content: '',
  });

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => {
      const job = data.data;
      reset({
        title: job.title,
        department: job.department ?? '',
        jobType: job.jobType,
        location: job.location,
        region: job.region,
        remoteEligible: job.remoteEligible,
        requiredSkills: (job.requiredSkills ?? []).map((s: string) => ({ skill: s })),
        minExperienceYears: job.minExperienceYears ?? 0,
        minEducationLevel: job.minEducationLevel ?? '',
        salaryMin: job.salaryMin ?? undefined,
        salaryMax: job.salaryMax ?? undefined,
        numberOfOpenings: job.numberOfOpenings ?? 1,
        applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : '',
      });
      editor?.commands.setContent(job.description ?? '');
    }).finally(() => setLoading(false));
  }, [id, editor, reset]);

  const handleSave = async (values: FormValues, publish: boolean) => {
    const description = editor?.getHTML() ?? '';
    if (!description || description === '<p></p>') {
      addToast({ type: 'error', title: 'Job description is required.' });
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/jobs/${id}`, {
        ...values,
        description,
        requiredSkills: values.requiredSkills.map((s) => s.skill),
        status: publish ? 'ACTIVE' : 'DRAFT',
        salaryMin: values.salaryMin || null,
        salaryMax: values.salaryMax || null,
        applicationDeadline: values.applicationDeadline || null,
      });
      addToast({ type: 'success', title: `Job ${publish ? 'published' : 'saved as draft'}.` });
      router.push('/employer/jobs');
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]" />
      </div>
    );
  }

  const charCount = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Job</h1>
      </div>

      <form className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-bold text-slate-900">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
            <input {...register('title')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input {...register('department')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Type *</label>
              <select {...register('jobType')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="COMMISSION_BASED">Commission Based</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
              <input {...register('location')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region *</label>
              <input {...register('region')} list="regions-list" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <datalist id="regions-list">
                {['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong-Ahafo'].map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('remoteEligible')} className="accent-[#1B4F72]" />
            <span className="text-slate-700 font-medium">Remote eligible</span>
          </label>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">Job Description *</h2>
            <span className={`text-xs ${charCount > 2800 ? 'text-red-500' : 'text-slate-400'}`}>{charCount}/3000</span>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex gap-1 border-b border-slate-200 p-2 bg-slate-50">
              {[
                { label: 'B', action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
                { label: 'I', action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
                { label: '• List', action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList') },
                { label: '1. List', action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList') },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.action}
                  className={`px-2 py-1 text-xs rounded font-mono ${btn.active ? 'bg-[#1B4F72] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[180px] focus:outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-bold text-slate-900">Requirements</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Required Skills *</label>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    {...register(`requiredSkills.${i}.skill`)}
                    list="skills-list"
                    placeholder="e.g. Digital Advertising"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                  )}
                </div>
              ))}
              <datalist id="skills-list">{SKILL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <button type="button" onClick={() => append({ skill: '' })} className="mt-2 text-sm text-[#1B4F72] font-semibold hover:underline">+ Add skill</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Experience (years)</label>
              <input type="number" {...register('minExperienceYears')} min={0} max={30} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Education Level</label>
              <select {...register('minEducationLevel')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Any</option>
                <option value="HND">HND</option>
                <option value="BSc">Bachelor&apos;s Degree</option>
                <option value="MSc">Master&apos;s Degree</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-bold text-slate-900">Compensation & Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Salary (GHC)</label>
              <input type="number" {...register('salaryMin')} placeholder="e.g. 2000" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max. Salary (GHC)</label>
              <input type="number" {...register('salaryMax')} placeholder="e.g. 5000" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings</label>
              <input type="number" {...register('numberOfOpenings')} min={1} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
              <input type="date" {...register('applicationDeadline')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleSubmit((v) => handleSave(v, false))}
            disabled={submitting}
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit((v) => handleSave(v, true))}
            disabled={submitting}
            className="px-5 py-2.5 bg-[#1B4F72] text-white rounded-lg text-sm font-bold hover:bg-[#2E86C1] disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Publish Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
