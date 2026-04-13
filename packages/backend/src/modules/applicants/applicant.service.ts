import { prisma } from '../../config/database';
import { uploadToS3 } from '../../config/s3';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { calculateProfileScore } from '../../utils/profileScore';
import { UpdateProfileDto, AddWorkExperienceDto, AddEducationDto } from './applicant.schema';
import { notify } from '../notifications/notification.service';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────
// Get own profile (full)
// ─────────────────────────────────────────────

export async function getOwnProfile(userId: string) {
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true, user: { select: { email: true, phone: true, status: true } } },
  });
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

// ─────────────────────────────────────────────
// Get applicant profile (employer view — limited)
// Hides phone/email until OFFER_MADE or HIRED
// ─────────────────────────────────────────────

export async function getApplicantProfileForEmployer(profileId: string, employerUserId: string) {
  const profile = await prisma.applicantProfile.findUnique({
    where: { id: profileId },
    include: {
      workExperiences: true,
      educations: true,
      user: { select: { email: true, phone: true, status: true } },
      applications: {
        where: {
          job: { employer: { userId: employerUserId } },
          status: { in: ['OFFER_MADE', 'HIRED'] },
        },
        take: 1,
      },
    },
  });

  if (!profile) throw new AppError('Applicant profile not found', 404);
  if (profile.completionScore < 60) throw new AppError('Profile not available', 404);

  const offerMade = profile.applications.length > 0;

  return {
    id: profile.id,
    fullName: profile.fullName,
    region: profile.region,
    district: profile.district,
    professionalSummary: profile.professionalSummary,
    skills: profile.skills,
    preferredJobTypes: profile.preferredJobTypes,
    preferredRegions: profile.preferredRegions,
    salaryMin: profile.salaryMin,
    salaryMax: profile.salaryMax,
    profilePhotoUrl: profile.profilePhotoUrl,
    cvUrl: offerMade ? profile.cvUrl : null,
    completionScore: profile.completionScore,
    workExperiences: profile.workExperiences,
    educations: profile.educations,
    // Only reveal contact details after OFFER_MADE
    email: offerMade ? profile.user.email : null,
    phone: offerMade ? profile.user.phone : null,
  };
}

// ─────────────────────────────────────────────
// Update Profile
// ─────────────────────────────────────────────

export async function updateProfile(userId: string, data: UpdateProfileDto, ipAddress?: string) {
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (!profile) throw new AppError('Profile not found', 404);

  // Check if Ghana Card number already taken by another user
  if (data.ghanaCardNumber) {
    const existing = await prisma.applicantProfile.findFirst({
      where: { ghanaCardNumber: data.ghanaCardNumber, NOT: { userId } },
    });
    if (existing) throw new AppError('Ghana Card number already registered', 409);
  }

  const updated = await prisma.applicantProfile.update({
    where: { userId },
    data: {
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      ghanaCardNumber: data.ghanaCardNumber,
      address: data.address,
      district: data.district,
      region: data.region,
      professionalSummary: data.professionalSummary,
      skills: data.skills,
      preferredJobTypes: data.preferredJobTypes,
      preferredRegions: data.preferredRegions,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
    },
    include: { workExperiences: true, educations: true },
  });

  // Recalculate completion score
  const score = calculateProfileScore(updated);
  const finalProfile = await prisma.applicantProfile.update({
    where: { userId },
    data: { completionScore: score },
    include: { workExperiences: true, educations: true },
  });

  await writeAuditLog({
    userId,
    action: 'PROFILE_UPDATE',
    entity: 'ApplicantProfile',
    entityId: profile.id,
    ipAddress,
  });

  return { profile: finalProfile, completionScore: score };
}

// ─────────────────────────────────────────────
// Upload Profile Photo
// ─────────────────────────────────────────────

export async function uploadProfilePhoto(userId: string, file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    throw new AppError('Only JPG and PNG images are allowed', 400);
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new AppError('Profile photo must be under 2MB', 400);
  }

  const key = `profiles/${userId}/photo${ext}`;
  const url = await uploadToS3(env.S3_BUCKET_PROFILES, key, file.buffer, file.mimetype);

  await prisma.applicantProfile.update({
    where: { userId },
    data: { profilePhotoUrl: url },
  });

  // Recalculate score
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (profile) {
    const score = calculateProfileScore(profile);
    await prisma.applicantProfile.update({ where: { userId }, data: { completionScore: score } });
  }

  return { profilePhotoUrl: url };
}

// ─────────────────────────────────────────────
// Upload CV
// ─────────────────────────────────────────────

export async function uploadCv(userId: string, file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.pdf', '.docx', '.doc'].includes(ext)) {
    throw new AppError('Only PDF and DOCX files are allowed', 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new AppError('CV must be under 5MB', 400);
  }

  const key = `documents/${userId}/cv-${uuidv4()}${ext}`;
  await uploadToS3(env.S3_BUCKET_DOCUMENTS, key, file.buffer, file.mimetype);

  // Store the S3 key (presigned URL generated on demand)
  const cvUrl = key;
  await prisma.applicantProfile.update({ where: { userId }, data: { cvUrl } });

  // Recalculate score
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (profile) {
    const score = calculateProfileScore(profile);
    await prisma.applicantProfile.update({ where: { userId }, data: { completionScore: score } });
  }

  return { message: 'CV uploaded successfully.', cvKey: cvUrl };
}

// ─────────────────────────────────────────────
// Work Experience CRUD
// ─────────────────────────────────────────────

export async function addWorkExperience(userId: string, data: AddWorkExperienceDto) {
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (!profile) throw new AppError('Profile not found', 404);
  if (profile.workExperiences.length >= 10) {
    throw new AppError('Maximum of 10 work experience entries allowed', 400);
  }

  const experience = await prisma.workExperience.create({
    data: {
      profileId: profile.id,
      companyName: data.companyName,
      role: data.role,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isCurrent: data.isCurrent,
      responsibilities: data.responsibilities,
    },
  });

  // Update completion score
  const updated = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (updated) {
    const score = calculateProfileScore(updated);
    await prisma.applicantProfile.update({ where: { userId }, data: { completionScore: score } });
  }

  return experience;
}

export async function updateWorkExperience(
  userId: string,
  experienceId: string,
  data: Partial<AddWorkExperienceDto>
) {
  const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError('Profile not found', 404);

  const experience = await prisma.workExperience.findFirst({
    where: { id: experienceId, profileId: profile.id },
  });
  if (!experience) throw new AppError('Work experience entry not found', 404);

  const updated = await prisma.workExperience.update({
    where: { id: experienceId },
    data: {
      companyName: data.companyName,
      role: data.role,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isCurrent: data.isCurrent,
      responsibilities: data.responsibilities,
    },
  });

  return updated;
}

export async function deleteWorkExperience(userId: string, experienceId: string) {
  const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError('Profile not found', 404);

  const experience = await prisma.workExperience.findFirst({
    where: { id: experienceId, profileId: profile.id },
  });
  if (!experience) throw new AppError('Work experience entry not found', 404);

  await prisma.workExperience.delete({ where: { id: experienceId } });

  const updatedProfile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (updatedProfile) {
    const score = calculateProfileScore(updatedProfile);
    await prisma.applicantProfile.update({ where: { userId }, data: { completionScore: score } });
  }

  return { message: 'Work experience deleted.' };
}

// ─────────────────────────────────────────────
// Education CRUD
// ─────────────────────────────────────────────

export async function addEducation(userId: string, data: AddEducationDto) {
  const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError('Profile not found', 404);

  const education = await prisma.education.create({
    data: {
      profileId: profile.id,
      institution: data.institution,
      qualification: data.qualification,
      graduationYear: data.graduationYear,
    },
  });

  const updated = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, educations: true },
  });
  if (updated) {
    const score = calculateProfileScore(updated);
    await prisma.applicantProfile.update({ where: { userId }, data: { completionScore: score } });
  }

  return education;
}

export async function deleteEducation(userId: string, educationId: string) {
  const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError('Profile not found', 404);

  const edu = await prisma.education.findFirst({ where: { id: educationId, profileId: profile.id } });
  if (!edu) throw new AppError('Education entry not found', 404);

  await prisma.education.delete({ where: { id: educationId } });
  return { message: 'Education entry deleted.' };
}

// ─────────────────────────────────────────────
// Search Applicants (Employer view)
// ─────────────────────────────────────────────

export async function searchApplicants(params: {
  skills?: string;
  region?: string;
  experience?: number;
  salaryMin?: number;
  salaryMax?: number;
  page: number;
  limit: number;
}) {
  const { skills, region, experience, salaryMin, salaryMax, page, limit } = params;

  const where: any = {
    completionScore: { gte: 60 }, // only visible profiles
    user: { status: 'ACTIVE' },
  };

  if (skills) {
    const skillList = skills.split(',').map((s) => s.trim());
    where.skills = { hasSome: skillList };
  }
  if (region) {
    where.region = { contains: region, mode: 'insensitive' };
  }
  if (salaryMin) {
    where.salaryMin = { gte: salaryMin };
  }
  if (salaryMax) {
    where.salaryMax = { lte: salaryMax };
  }

  const [applicants, total] = await Promise.all([
    prisma.applicantProfile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ completionScore: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        fullName: true,
        region: true,
        district: true,
        skills: true,
        preferredJobTypes: true,
        preferredRegions: true,
        salaryMin: true,
        salaryMax: true,
        profilePhotoUrl: true,
        completionScore: true,
        professionalSummary: true,
        workExperiences: { select: { id: true, role: true, companyName: true, startDate: true, endDate: true, isCurrent: true } },
        educations: { select: { id: true, qualification: true, institution: true, graduationYear: true } },
      },
    }),
    prisma.applicantProfile.count({ where }),
  ]);

  return { applicants, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─────────────────────────────────────────────
// Get Matched Jobs for Applicant
// ─────────────────────────────────────────────

export async function getMatchedJobs(userId: string, page: number, limit: number) {
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true },
  });
  if (!profile) throw new AppError('Profile not found', 404);

  const activeJobs = await prisma.jobListing.findMany({
    where: { status: 'ACTIVE' },
    include: { employer: { select: { companyName: true, logoUrl: true, industryType: true } } },
  });

  const { calculateMatchScore } = await import('../../utils/matchScore');

  const scored = activeJobs.map((job) => ({
    job,
    score: calculateMatchScore(profile as any, job),
  }));

  const filtered = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return {
    jobs: paged.map(({ job, score }) => ({ ...job, matchScore: score })),
    total: filtered.length,
    page,
    limit,
  };
}

// ─────────────────────────────────────────────
// Skills Taxonomy
// ─────────────────────────────────────────────

export async function getSkillsTaxonomy() {
  const skills = await prisma.skill.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return skills;
}
