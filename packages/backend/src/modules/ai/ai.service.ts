import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 500): Promise<string> {
  if (!AI_API_KEY) {
    throw new AppError('AI features are not configured. Please set AI_API_KEY.', 503);
  }

  const response = await fetch(`${AI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    logger.error(`AI API error: ${response.status} ${response.statusText}`);
    throw new AppError('AI service temporarily unavailable', 503);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content?.trim() || '';
}

export async function getProfileCoachSuggestions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      applicantProfile: {
        include: { skills: true, workExperiences: true, educations: true },
      },
    },
  });

  if (!user?.applicantProfile) throw new AppError('Applicant profile not found', 404);

  const profile = user.applicantProfile;
  const skillNames = profile.skills.map((s: { name: string }) => s.name).join(', ') || 'none listed';
  const experienceYears = profile.workExperiences.length;
  const educationCount = profile.educations.length;

  const userPrompt = `
Applicant Profile:
- Name: ${profile.fullName}
- Bio: ${profile.bio || 'empty'}
- Region: ${profile.region || 'not set'}
- Skills: ${skillNames}
- Work experiences: ${experienceYears} entries
- Education: ${educationCount} entries
- Profile completion: ${profile.completionScore}%
- CV uploaded: ${profile.cvUrl ? 'yes' : 'no'}

Provide 3-5 specific, actionable suggestions to improve this profile for media sales roles in Ghana. Format as a JSON array of objects with "suggestion" and "impact" (estimated % improvement) fields.`;

  const result = await callAI(
    'You are a career coach specializing in media sales recruitment in Ghana. Analyze the profile and provide specific improvement suggestions. Always respond with valid JSON.',
    userPrompt,
    600,
  );

  try {
    const parsed = JSON.parse(result);
    return { suggestions: parsed, completionScore: profile.completionScore };
  } catch {
    return {
      suggestions: [{ suggestion: result, impact: 'varies' }],
      completionScore: profile.completionScore,
    };
  }
}

export async function generateJobDescription(userId: string, input: {
  title: string;
  department?: string;
  jobType: string;
  location: string;
  keyResponsibilities?: string;
  requirements?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mediaHouse: true },
  });
  if (!user?.mediaHouse) throw new AppError('Employer not found', 404);

  const userPrompt = `
Company: ${user.mediaHouse.companyName} (${user.mediaHouse.industryType} media)
Job Title: ${input.title}
Department: ${input.department || 'General'}
Type: ${input.jobType}
Location: ${input.location}
Key Responsibilities (draft): ${input.keyResponsibilities || 'not provided'}
Requirements (draft): ${input.requirements || 'not provided'}

Generate a compelling, professional job description for this media sales role. Include: overview paragraph, key responsibilities (5-7 bullets), requirements (4-6 bullets), and what the company offers. Use industry-specific language for Ghana's media landscape. Return as JSON with fields: "overview", "responsibilities" (array), "requirements" (array), "benefits" (array).`;

  const result = await callAI(
    'You are an expert HR copywriter for Ghana\'s media industry. Write compelling job descriptions that attract top sales talent. Always respond with valid JSON.',
    userPrompt,
    800,
  );

  try {
    return JSON.parse(result);
  } catch {
    return { description: result };
  }
}

export async function summarizeCandidateForJob(userId: string, applicationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mediaHouse: true },
  });
  if (!user?.mediaHouse) throw new AppError('Employer not found', 404);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        include: {
          user: { select: { email: true } },
          skills: true,
          workExperiences: true,
          educations: true,
        },
      },
      job: true,
    },
  });
  if (!application) throw new AppError('Application not found', 404);
  if (application.job.employerId !== user.mediaHouse.id) {
    throw new AppError('Not authorized to view this application', 403);
  }

  const candidate = application.applicant;
  const skills = candidate.skills.map((s: { name: string }) => s.name).join(', ');
  const experience = candidate.workExperiences
    .map((w: { title: string; companyName: string }) => `${w.title} at ${w.companyName}`)
    .join('; ');

  const userPrompt = `
Job: ${application.job.title} (${application.job.jobType})
Required Skills: ${application.job.requiredSkills.join(', ')}
Min Experience: ${application.job.minExperienceYears} years

Candidate: ${candidate.fullName}
Skills: ${skills}
Experience: ${experience || 'none listed'}
Education: ${candidate.educations.map((e: { degree: string; institution: string }) => `${e.degree} from ${e.institution}`).join('; ') || 'none listed'}
Cover Letter: ${application.coverLetter || 'not provided'}

Provide a 2-3 sentence AI summary of this candidate's fit for the specific role, highlighting strengths and any gaps. Return as JSON with "summary", "strengths" (array), "gaps" (array), and "fitScore" (0-100).`;

  const result = await callAI(
    'You are a recruitment analyst specializing in media sales. Summarize candidate fit concisely and accurately. Always respond with valid JSON.',
    userPrompt,
    400,
  );

  try {
    return JSON.parse(result);
  } catch {
    return { summary: result, strengths: [], gaps: [], fitScore: null };
  }
}

export async function getSalaryInsights(params: {
  role?: string;
  region?: string;
  jobType?: string;
}) {
  const { role, region, jobType } = params;

  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (region) where.region = { contains: region, mode: 'insensitive' };
  if (jobType) where.jobType = jobType;

  const placements = await prisma.placement.findMany({
    where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
    include: {
      job: {
        select: { title: true, region: true, jobType: true, salaryMin: true, salaryMax: true },
      },
    },
    take: 200,
    orderBy: { createdAt: 'desc' },
  });

  const jobs = await prisma.jobListing.findMany({
    where: {
      ...where,
      salaryMin: { not: null },
    },
    select: { title: true, region: true, jobType: true, salaryMin: true, salaryMax: true },
    take: 200,
    orderBy: { createdAt: 'desc' },
  });

  const salaryData = jobs
    .filter((j) => j.salaryMin)
    .map((j) => ({
      title: j.title,
      region: j.region,
      type: j.jobType,
      min: Number(j.salaryMin),
      max: j.salaryMax ? Number(j.salaryMax) : Number(j.salaryMin),
    }));

  if (salaryData.length === 0) {
    return {
      message: 'Not enough salary data to generate insights',
      dataPoints: 0,
    };
  }

  const allMins = salaryData.map((d) => d.min);
  const allMaxs = salaryData.map((d) => d.max);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const insights = {
    dataPoints: salaryData.length,
    placementsAnalyzed: placements.length,
    overallRange: {
      min: Math.min(...allMins),
      max: Math.max(...allMaxs),
      average: Math.round(avg(allMins.concat(allMaxs))),
      median: allMins.concat(allMaxs).sort((a, b) => a - b)[Math.floor(allMins.length)],
    },
    byRegion: groupBy(salaryData, 'region'),
    byType: groupBy(salaryData, 'type'),
    queryFilters: { role, region, jobType },
  };

  return insights;
}

function groupBy(data: { region: string; type: string; min: number; max: number }[], key: 'region' | 'type') {
  const groups: Record<string, { count: number; avgMin: number; avgMax: number }> = {};
  for (const item of data) {
    const k = item[key];
    if (!groups[k]) groups[k] = { count: 0, avgMin: 0, avgMax: 0 };
    groups[k].count++;
    groups[k].avgMin += item.min;
    groups[k].avgMax += item.max;
  }
  for (const k of Object.keys(groups)) {
    groups[k].avgMin = Math.round(groups[k].avgMin / groups[k].count);
    groups[k].avgMax = Math.round(groups[k].avgMax / groups[k].count);
  }
  return groups;
}
