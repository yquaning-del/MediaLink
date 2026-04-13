import { ApplicantProfile, WorkExperience, Education } from '@prisma/client';

type ProfileWithRelations = ApplicantProfile & {
  workExperiences: WorkExperience[];
  educations: Education[];
};

/**
 * Calculates applicant profile completion score (0–100).
 *
 * Scoring weights (per SRS §3.1.3):
 *   Personal info (DOB, gender, photo, address, region)  — 20%
 *   Ghana Card number                                      — 10%
 *   Professional summary (200–500 chars)                  — 10%
 *   Work experience (≥1 entry)                            — 20%
 *   Education (≥1 entry)                                  — 10%
 *   Skills (≥3 selected)                                  — 15%
 *   CV uploaded                                           — 10%
 *   Salary range set                                      — 5%
 *
 * Profiles below 60% are hidden from employer search results.
 */
export function calculateProfileScore(profile: ProfileWithRelations): number {
  let score = 0;

  // Personal info — up to 20 points
  // 4 fields: DOB, gender, profile photo, address+region = 5 points each
  if (profile.dateOfBirth) score += 5;
  if (profile.gender) score += 5;
  if (profile.profilePhotoUrl) score += 5;
  if (profile.address && profile.region) score += 5;

  // Ghana Card — 10 points
  if (profile.ghanaCardNumber) score += 10;

  // Professional summary — 10 points (must be 200–500 chars)
  if (profile.professionalSummary && profile.professionalSummary.length >= 200) score += 10;

  // Work experience (at least 1 entry) — 20 points
  if (profile.workExperiences.length >= 1) score += 20;

  // Education (at least 1 entry) — 10 points
  if (profile.educations.length >= 1) score += 10;

  // Skills (at least 3 selected) — 15 points
  if (profile.skills.length >= 3) score += 15;

  // CV uploaded — 10 points
  if (profile.cvUrl) score += 10;

  // Salary range — 5 points
  if (profile.salaryMin !== null && profile.salaryMax !== null) score += 5;

  return Math.min(100, score);
}

/**
 * Returns total years of professional experience across all work entries.
 */
export function calculateYearsOfExperience(experiences: WorkExperience[]): number {
  const now = new Date();
  let totalMs = 0;

  for (const exp of experiences) {
    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? now : exp.endDate ? new Date(exp.endDate) : now;
    totalMs += end.getTime() - start.getTime();
  }

  return totalMs / (1000 * 60 * 60 * 24 * 365.25);
}
