import { ApplicantProfile, JobListing, WorkExperience } from '@prisma/client';
import { calculateYearsOfExperience } from './profileScore';

type ProfileWithExperience = ApplicantProfile & { workExperiences: WorkExperience[] };

/**
 * Weighted applicant-job compatibility score (0–100).
 *
 * Weights per SRS §3.3.1:
 *   Skills Match          35% — overlap between applicant skills and job required skills
 *   Experience Match      25% — years of experience vs. job requirement
 *   Location Preference   20% — applicant preferred regions vs. job region
 *   Salary Alignment      12% — overlap between expected range and offered range
 *   Profile Completeness   8% — higher completion profiles ranked higher
 */
export function calculateMatchScore(
  applicant: ProfileWithExperience,
  job: JobListing
): number {
  let score = 0;

  // ── Skills Match (35%) ──────────────────────────────────────
  if (job.requiredSkills.length > 0) {
    const applicantSkillsLower = applicant.skills.map((s) => s.toLowerCase());
    const requiredSkillsLower = job.requiredSkills.map((s) => s.toLowerCase());
    const matched = requiredSkillsLower.filter((s) => applicantSkillsLower.includes(s));
    score += (matched.length / requiredSkillsLower.length) * 35;
  } else {
    score += 35; // no required skills = full marks
  }

  // ── Experience Match (25%) ──────────────────────────────────
  const yearsExp = calculateYearsOfExperience(applicant.workExperiences);
  if (job.minExperienceYears === 0) {
    score += 25;
  } else {
    const expRatio = Math.min(yearsExp / job.minExperienceYears, 1);
    score += expRatio * 25;
  }

  // ── Location Preference (20%) ───────────────────────────────
  const preferredRegionsLower = applicant.preferredRegions.map((r) => r.toLowerCase());
  if (
    preferredRegionsLower.includes(job.region.toLowerCase()) ||
    preferredRegionsLower.length === 0 // no preference = willing to work anywhere
  ) {
    score += 20;
  }

  // ── Salary Alignment (12%) ──────────────────────────────────
  const appMin = applicant.salaryMin ? Number(applicant.salaryMin) : null;
  const appMax = applicant.salaryMax ? Number(applicant.salaryMax) : null;
  const jobMin = job.salaryMin ? Number(job.salaryMin) : null;
  const jobMax = job.salaryMax ? Number(job.salaryMax) : null;

  if (!appMin || !appMax || !jobMin || !jobMax) {
    // If either party hasn't set salary, give partial credit
    score += 6;
  } else {
    const overlapStart = Math.max(appMin, jobMin);
    const overlapEnd = Math.min(appMax, jobMax);
    if (overlapEnd >= overlapStart) {
      const appRange = appMax - appMin || 1;
      const overlapRatio = Math.min((overlapEnd - overlapStart) / appRange, 1);
      score += overlapRatio * 12;
    }
  }

  // ── Profile Completeness (8%) ────────────────────────────────
  score += (applicant.completionScore / 100) * 8;

  return Math.round(score * 100) / 100; // round to 2dp
}

/**
 * Returns true if the applicant should be notified about the job (score >= 70%).
 */
export function isMatchAboveThreshold(score: number): boolean {
  return score >= 70;
}
