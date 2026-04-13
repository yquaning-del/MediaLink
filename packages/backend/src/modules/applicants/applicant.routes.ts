import { Router } from 'express';
import * as controller from './applicant.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  updateProfileSchema,
  addWorkExperienceSchema,
  addEducationSchema,
} from './applicant.schema';

const router = Router();

// ── Skills Taxonomy (public) ──────────────────────────────────
router.get('/skills', controller.getSkillsTaxonomy as any);

// ── Own Profile ───────────────────────────────────────────────
router.get('/profile', authenticate, controller.getOwnProfile as any);
router.put('/profile', authenticate, validate(updateProfileSchema), controller.updateProfile as any);

// ── File Uploads ──────────────────────────────────────────────
router.post(
  '/profile/photo',
  authenticate,
  controller.upload.single('photo'),
  controller.uploadPhoto as any
);
router.post(
  '/profile/cv',
  authenticate,
  controller.upload.single('cv'),
  controller.uploadCv as any
);

// ── Work Experience ───────────────────────────────────────────
router.post('/profile/experience', authenticate, validate(addWorkExperienceSchema), controller.addWorkExperience as any);
router.put('/profile/experience/:id', authenticate, controller.updateWorkExperience as any);
router.delete('/profile/experience/:id', authenticate, controller.deleteWorkExperience as any);

// ── Education ─────────────────────────────────────────────────
router.post('/profile/education', authenticate, validate(addEducationSchema), controller.addEducation as any);
router.delete('/profile/education/:id', authenticate, controller.deleteEducation as any);

// ── Matched Jobs ──────────────────────────────────────────────
router.get('/jobs/matches', authenticate, controller.getMatchedJobs as any);

// ── Employer: browse candidates ───────────────────────────────
router.get('/search', authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), controller.searchApplicants as any);

// ── Employer: view specific candidate ────────────────────────
router.get('/:id', authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), controller.getApplicantProfile as any);

export default router;
