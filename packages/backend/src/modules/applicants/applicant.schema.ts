import { z } from 'zod';

export const updateProfileSchema = z.object({
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Prefer not to say']).optional().nullable(),
  ghanaCardNumber: z
    .string()
    .regex(/^GHA-\d{9}-\d$/, 'Ghana Card format: GHA-XXXXXXXXX-X')
    .optional()
    .nullable(),
  address: z.string().max(500).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  professionalSummary: z
    .string()
    .min(200, 'Professional summary must be at least 200 characters')
    .max(500, 'Professional summary must not exceed 500 characters')
    .optional()
    .nullable(),
  skills: z.array(z.string().min(1)).max(50).optional(),
  preferredJobTypes: z
    .array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED']))
    .optional(),
  preferredRegions: z.array(z.string()).optional(),
  salaryMin: z.coerce.number().positive().optional().nullable(),
  salaryMax: z.coerce.number().positive().optional().nullable(),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) return data.salaryMax >= data.salaryMin;
    return true;
  },
  { message: 'Maximum salary must be greater than minimum salary', path: ['salaryMax'] }
);

export const addWorkExperienceSchema = z.object({
  companyName: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
  responsibilities: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => {
    if (!data.isCurrent && !data.endDate) return false;
    return true;
  },
  { message: 'End date required for past roles', path: ['endDate'] }
);

export const addEducationSchema = z.object({
  institution: z.string().min(1).max(200),
  qualification: z.string().min(1).max(200),
  graduationYear: z.coerce.number().min(1950).max(new Date().getFullYear() + 5),
});

export const applicantSearchSchema = z.object({
  skills: z.string().optional(),         // comma-separated
  region: z.string().optional(),
  experience: z.coerce.number().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'COMMISSION_BASED']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AddWorkExperienceDto = z.infer<typeof addWorkExperienceSchema>;
export type AddEducationDto = z.infer<typeof addEducationSchema>;
