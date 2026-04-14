import { z } from 'zod';

const jobFieldsSchema = z.object({
  title: z.string().min(3).max(200),
  department: z.string().max(100).optional().nullable(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED']),
  location: z.string().min(2).max(200),
  region: z.string().min(2).max(100),
  remoteEligible: z.boolean().default(false),
  description: z.string().min(50).max(3000, 'Job description cannot exceed 3000 characters'),
  requiredSkills: z.array(z.string()).min(1, 'At least one required skill is needed').max(20),
  minExperienceYears: z.coerce.number().min(0).max(30).default(0),
  minEducationLevel: z.string().max(100).optional().nullable(),
  salaryMin: z.coerce.number().positive().optional().nullable(),
  salaryMax: z.coerce.number().positive().optional().nullable(),
  applicationDeadline: z.string().datetime().optional().nullable(),
  numberOfOpenings: z.coerce.number().min(1).max(100).default(1),
  status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
});

const salaryRefineMessage = {
  message: 'Maximum salary must be greater than minimum salary',
  path: ['salaryMax'],
};

export const createJobSchema = jobFieldsSchema.refine(
  (d) => !d.salaryMin || !d.salaryMax || d.salaryMax >= d.salaryMin,
  salaryRefineMessage
);

export const updateJobSchema = jobFieldsSchema.partial().refine(
  (d) => !d.salaryMin || !d.salaryMax || d.salaryMax >= d.salaryMin,
  salaryRefineMessage
);

export const updateJobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED']),
});

export const jobSearchSchema = z.object({
  q: z.string().optional(),
  skills: z.string().optional(),
  region: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED']).optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  experience: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;
