import { Response } from 'express';
import multer from 'multer';
import * as applicantService from './applicant.service';
import { sendSuccess, sendError, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../types';

// Multer — memory storage (files go straight to S3)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export async function getOwnProfile(req: AuthRequest, res: Response): Promise<void> {
  const profile = await applicantService.getOwnProfile(req.user!.id);
  sendSuccess(res, profile);
}

export async function getApplicantProfile(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const profile = await applicantService.getApplicantProfileForEmployer(id, req.user!.id);
  sendSuccess(res, profile);
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const result = await applicantService.updateProfile(req.user!.id, req.body, req.ip);
  sendSuccess(res, result, 'Profile updated successfully.');
}

export async function uploadPhoto(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }
  const result = await applicantService.uploadProfilePhoto(req.user!.id, req.file);
  sendSuccess(res, result, 'Profile photo uploaded.');
}

export async function uploadCv(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }
  const result = await applicantService.uploadCv(req.user!.id, req.file);
  sendSuccess(res, result, 'CV uploaded successfully.');
}

export async function addWorkExperience(req: AuthRequest, res: Response): Promise<void> {
  const result = await applicantService.addWorkExperience(req.user!.id, req.body);
  sendSuccess(res, result, 'Work experience added.', 201);
}

export async function updateWorkExperience(req: AuthRequest, res: Response): Promise<void> {
  const result = await applicantService.updateWorkExperience(req.user!.id, req.params.id, req.body);
  sendSuccess(res, result, 'Work experience updated.');
}

export async function deleteWorkExperience(req: AuthRequest, res: Response): Promise<void> {
  const result = await applicantService.deleteWorkExperience(req.user!.id, req.params.id);
  sendSuccess(res, result);
}

export async function addEducation(req: AuthRequest, res: Response): Promise<void> {
  const result = await applicantService.addEducation(req.user!.id, req.body);
  sendSuccess(res, result, 'Education entry added.', 201);
}

export async function deleteEducation(req: AuthRequest, res: Response): Promise<void> {
  const result = await applicantService.deleteEducation(req.user!.id, req.params.id);
  sendSuccess(res, result);
}

export async function searchApplicants(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
  const query = req.query as Record<string, string>;
  const result = await applicantService.searchApplicants({
    skills: query.skills,
    region: query.region,
    experience: query.experience ? Number(query.experience) : undefined,
    salaryMin: query.salaryMin ? Number(query.salaryMin) : undefined,
    salaryMax: query.salaryMax ? Number(query.salaryMax) : undefined,
    page,
    limit,
  });
  sendSuccess(res, result.applicants, 'Candidates retrieved.', 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}

export async function getMatchedJobs(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
  const result = await applicantService.getMatchedJobs(req.user!.id, page, limit);
  sendSuccess(res, result.jobs, 'Matched jobs retrieved.', 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
}

export async function getSkillsTaxonomy(_req: AuthRequest, res: Response): Promise<void> {
  const skills = await applicantService.getSkillsTaxonomy();
  sendSuccess(res, skills);
}
