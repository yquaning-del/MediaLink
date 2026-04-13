import type { AuthUser, UserRole } from './store';

// ── Fake JWT builder ─────────────────────────────────────────────────────
// The middleware only base64-decodes the payload; it never verifies the
// signature, so a dummy signature is sufficient for local testing.

function base64url(obj: Record<string, unknown>): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export type DemoRole = 'APPLICANT' | 'EMPLOYER' | 'ADMIN';

const DEMO_IDS: Record<DemoRole, { id: string; email: string }> = {
  APPLICANT: { id: 'demo-applicant-001', email: 'demo-applicant@medialink.test' },
  EMPLOYER: { id: 'demo-employer-001', email: 'demo-employer@medialink.test' },
  ADMIN: { id: 'demo-admin-001', email: 'demo-admin@medialink.test' },
};

export function createDemoJwt(role: DemoRole): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const { id, email } = DEMO_IDS[role];
  const payload = {
    id,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  };
  return `${base64url(header as any)}.${base64url(payload as any)}.demo-signature`;
}

// ── Demo user objects ────────────────────────────────────────────────────

export const DEMO_USERS: Record<DemoRole, AuthUser> = {
  APPLICANT: {
    id: 'demo-applicant-001',
    email: 'demo-applicant@medialink.test',
    phone: '+233200000001',
    role: 'APPLICANT',
    status: 'ACTIVE',
  },
  EMPLOYER: {
    id: 'demo-employer-001',
    email: 'demo-employer@medialink.test',
    phone: '+233200000002',
    role: 'EMPLOYER',
    status: 'ACTIVE',
  },
  ADMIN: {
    id: 'demo-admin-001',
    email: 'demo-admin@medialink.test',
    phone: '+233200000003',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
};

// ── Mock employer analytics ──────────────────────────────────────────────

export const MOCK_EMPLOYER_ANALYTICS = {
  activeJobs: 4,
  totalApplications: 27,
  shortlisted: 8,
  hired: 3,
  totalPlacements: 3,
  kybStatus: 'APPROVED',
  recentJobs: [
    { id: 'j1', title: 'Senior Media Sales Executive', status: 'ACTIVE', applicationCount: 12, viewCount: 84, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'j2', title: 'Digital Advertising Account Manager', status: 'ACTIVE', applicationCount: 9, viewCount: 61, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'j3', title: 'Radio Ad Sales Representative', status: 'ACTIVE', applicationCount: 4, viewCount: 38, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: 'j4', title: 'Outdoor Media Sales Lead', status: 'CLOSED', applicationCount: 2, viewCount: 22, createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  ],
  recentApplications: [
    { id: 'a1', applicant: { fullName: 'Kwame Asante' }, job: { title: 'Senior Media Sales Executive' }, status: 'SHORTLISTED', appliedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'a2', applicant: { fullName: 'Abena Mensah' }, job: { title: 'Digital Advertising Account Manager' }, status: 'APPLIED', appliedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'a3', applicant: { fullName: 'Kofi Boateng' }, job: { title: 'Senior Media Sales Executive' }, status: 'INTERVIEWED', appliedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'a4', applicant: { fullName: 'Esi Appiah' }, job: { title: 'Radio Ad Sales Representative' }, status: 'HIRED', appliedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  ],
};

// ── Mock applicant dashboard data ────────────────────────────────────────

export const MOCK_APPLICANT_DATA = {
  profile: { completionScore: 72, fullName: 'Kwame Asante', profilePhotoUrl: undefined },
  matchedJobs: [
    { id: 'j1', title: 'Senior Media Sales Executive', employer: { companyName: 'Multimedia Group' }, region: 'Greater Accra', jobType: 'Full-Time', matchScore: 92 },
    { id: 'j2', title: 'Digital Advertising Sales Lead', employer: { companyName: 'Pulse Ghana' }, region: 'Greater Accra', jobType: 'Full-Time', matchScore: 85 },
    { id: 'j3', title: 'Radio Ad Sales Representative', employer: { companyName: 'Starr FM' }, region: 'Ashanti', jobType: 'Commission', matchScore: 78 },
    { id: 'j4', title: 'Outdoor Media Account Manager', employer: { companyName: 'Alliance Media Ghana' }, region: 'Greater Accra', jobType: 'Full-Time', matchScore: 74 },
    { id: 'j5', title: 'TV Sponsorship Sales Coordinator', employer: { companyName: 'GTV' }, region: 'Greater Accra', jobType: 'Contract', matchScore: 69 },
  ],
  recentApplications: [
    { id: 'a1', job: { title: 'Senior Media Sales Executive', employer: { companyName: 'Multimedia Group' } }, status: 'SHORTLISTED', appliedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'a2', job: { title: 'Digital Advertising Sales Lead', employer: { companyName: 'Pulse Ghana' } }, status: 'APPLIED', appliedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'a3', job: { title: 'Radio Ad Sales Representative', employer: { companyName: 'Starr FM' } }, status: 'INTERVIEWED', appliedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],
  pendingPayments: [],
};

// ── Mock applicant sub-pages ──────────────────────────────────────────────

const D = 86400000; // one day in ms
const ago = (days: number) => new Date(Date.now() - days * D).toISOString();

export const MOCK_APPLICANT_JOBS = [
  { id: 'j1', title: 'Senior Media Sales Executive', employer: { companyName: 'Multimedia Group', industryType: 'TV' }, region: 'Greater Accra', jobType: 'Full-Time', salaryMin: 4000, salaryMax: 6000, requiredSkills: ['TV Sales', 'Client Management'], isFeatured: true, applicationDeadline: ago(-14), viewCount: 84, createdAt: ago(2) },
  { id: 'j2', title: 'Digital Advertising Sales Lead', employer: { companyName: 'Pulse Ghana', industryType: 'Digital' }, region: 'Greater Accra', jobType: 'Full-Time', salaryMin: 3500, salaryMax: 5500, requiredSkills: ['Programmatic', 'Google Ads'], isFeatured: true, applicationDeadline: ago(-7), viewCount: 61, createdAt: ago(5) },
  { id: 'j3', title: 'Radio Ad Sales Representative', employer: { companyName: 'Starr FM', industryType: 'Radio' }, region: 'Ashanti', jobType: 'Commission', requiredSkills: ['Radio', 'Negotiation'], isFeatured: false, viewCount: 38, createdAt: ago(7) },
  { id: 'j4', title: 'Outdoor Media Account Manager', employer: { companyName: 'Alliance Media Ghana', industryType: 'Outdoor' }, region: 'Greater Accra', jobType: 'Full-Time', salaryMin: 3000, salaryMax: 4500, requiredSkills: ['Billboard', 'OOH'], isFeatured: false, viewCount: 22, createdAt: ago(14) },
];

export const MOCK_APPLICANT_APPLICATIONS = [
  { id: 'a1', status: 'SHORTLISTED', matchScore: 92, appliedAt: ago(1), job: { id: 'j1', title: 'Senior Media Sales Executive', location: 'Accra', jobType: 'Full-Time', employer: { companyName: 'Multimedia Group' } } },
  { id: 'a2', status: 'APPLIED', matchScore: 85, appliedAt: ago(3), job: { id: 'j2', title: 'Digital Advertising Sales Lead', location: 'Accra', jobType: 'Full-Time', employer: { companyName: 'Pulse Ghana' } } },
  { id: 'a3', status: 'INTERVIEWED', matchScore: 78, appliedAt: ago(5), job: { id: 'j3', title: 'Radio Ad Sales Representative', location: 'Kumasi', jobType: 'Commission', employer: { companyName: 'Starr FM' } } },
];

export const MOCK_APPLICANT_PLACEMENTS = [
  { id: 'p1', startDate: ago(60), salaryAgreed: 4500, revenueShareRate: 3.5, monthsRemaining: 4, status: 'ACTIVE', application: { job: { title: 'Senior Media Sales Executive', employer: { companyName: 'Multimedia Group' } } }, schedules: [
    { id: 's1', monthNumber: 1, dueDate: ago(30), amount: 157.5, status: 'SUCCESS' },
    { id: 's2', monthNumber: 2, dueDate: ago(0), amount: 157.5, status: 'PENDING' },
  ] },
];

export const MOCK_APPLICANT_PAYMENTS = [
  { id: 'pay1', type: 'REGISTRATION', amount: 50, status: 'SUCCESS', channel: 'MOBILE_MONEY', paidAt: ago(90), createdAt: ago(90) },
  { id: 'pay2', type: 'REVENUE_SHARE', amount: 157.5, status: 'SUCCESS', channel: 'MOBILE_MONEY', paidAt: ago(30), createdAt: ago(30) },
];

export const MOCK_APPLICANT_MESSAGES = [
  { id: 'm1', body: 'Congratulations! You have been shortlisted for the Senior Media Sales Executive position.', subject: 'Application Update', read: true, sentAt: ago(1), sender: { id: 'u1', email: 'hr@multimedia.test', mediaHouse: { companyName: 'Multimedia Group' } } },
  { id: 'm2', body: 'Your interview has been scheduled for next Tuesday at 10 AM.', subject: 'Interview Invitation', read: false, sentAt: ago(2), sender: { id: 'u2', email: 'recruit@starrfm.test', mediaHouse: { companyName: 'Starr FM' } } },
];

export const MOCK_APPLICANT_PROFILE = {
  fullName: 'Kwame Asante',
  email: 'demo-applicant@medialink.test',
  phone: '+233200000001',
  region: 'Greater Accra',
  city: 'Accra',
  bio: 'Experienced media sales professional with 5+ years in TV and digital advertising.',
  completionScore: 72,
  referralCode: 'KWAME2024',
  skills: [{ id: 'sk1', name: 'TV Sales' }, { id: 'sk2', name: 'Digital Advertising' }, { id: 'sk3', name: 'Client Management' }],
  workExperiences: [{ id: 'w1', companyName: 'Multimedia Group', title: 'Sales Executive', startDate: ago(730), current: true }],
  educations: [{ id: 'e1', institution: 'University of Ghana', degree: 'Bachelor', fieldOfStudy: 'Marketing', graduationYear: 2018 }],
  cvUrl: undefined,
};

// ── Mock employer sub-pages ──────────────────────────────────────────────

export const MOCK_EMPLOYER_JOBS = [
  { id: 'j1', title: 'Senior Media Sales Executive', status: 'ACTIVE', jobType: 'Full-Time', region: 'Greater Accra', viewCount: 84, applicationCount: 12, isFeatured: true, createdAt: ago(2), applicationDeadline: ago(-14) },
  { id: 'j2', title: 'Digital Advertising Account Manager', status: 'ACTIVE', jobType: 'Full-Time', region: 'Greater Accra', viewCount: 61, applicationCount: 9, isFeatured: false, createdAt: ago(5) },
  { id: 'j3', title: 'Radio Ad Sales Representative', status: 'ACTIVE', jobType: 'Commission', region: 'Ashanti', viewCount: 38, applicationCount: 4, isFeatured: false, createdAt: ago(7) },
  { id: 'j4', title: 'Outdoor Media Sales Lead', status: 'CLOSED', jobType: 'Full-Time', region: 'Greater Accra', viewCount: 22, applicationCount: 2, isFeatured: false, createdAt: ago(14) },
];

export const MOCK_EMPLOYER_CANDIDATES = [
  { id: 'c1', fullName: 'Kwame Asante', region: 'Greater Accra', completionScore: 88, skills: ['TV Sales', 'Digital Advertising'], preferredJobTypes: ['Full-Time'], workExperiences: [{ role: 'Sales Executive', companyName: 'Multimedia Group', isCurrent: true }] },
  { id: 'c2', fullName: 'Abena Mensah', region: 'Greater Accra', completionScore: 92, skills: ['Radio Sales', 'Negotiation'], preferredJobTypes: ['Full-Time', 'Commission'], workExperiences: [{ role: 'Ad Sales Lead', companyName: 'Starr FM', isCurrent: true }] },
  { id: 'c3', fullName: 'Kofi Boateng', region: 'Ashanti', completionScore: 75, skills: ['Outdoor Media', 'OOH'], preferredJobTypes: ['Full-Time'], workExperiences: [{ role: 'Account Manager', companyName: 'Alliance Media Ghana', isCurrent: false }] },
];

export const MOCK_EMPLOYER_APPLICATIONS = [
  { id: 'a1', status: 'SHORTLISTED' as const, matchScore: 92, appliedAt: ago(1), applicant: { id: 'c1', fullName: 'Kwame Asante', region: 'Greater Accra', completionScore: 88 }, job: { id: 'j1', title: 'Senior Media Sales Executive' } },
  { id: 'a2', status: 'APPLIED' as const, matchScore: 85, appliedAt: ago(2), applicant: { id: 'c2', fullName: 'Abena Mensah', region: 'Greater Accra', completionScore: 92 }, job: { id: 'j1', title: 'Senior Media Sales Executive' } },
  { id: 'a3', status: 'INTERVIEWED' as const, matchScore: 78, appliedAt: ago(3), applicant: { id: 'c3', fullName: 'Kofi Boateng', region: 'Ashanti', completionScore: 75 }, job: { id: 'j2', title: 'Digital Advertising Account Manager' } },
];

export const MOCK_EMPLOYER_PLACEMENTS = [
  { id: 'p1', startDate: ago(60), salaryAgreed: 4500, revenueShareRate: 3.5, monthsRemaining: 4, status: 'ACTIVE', applicant: { fullName: 'Esi Appiah', user: { email: 'esi@test.com' } }, application: { job: { title: 'Radio Ad Sales Representative' } }, schedules: [
    { monthNumber: 1, dueDate: ago(30), amount: 157.5, status: 'SUCCESS' },
    { monthNumber: 2, dueDate: ago(0), amount: 157.5, status: 'PENDING' },
  ] },
];

export const MOCK_EMPLOYER_ANALYTICS_FULL = {
  activeJobs: 4,
  totalApplications: 27,
  shortlisted: 8,
  hired: 3,
  totalPlacements: 3,
  jobPerformance: [
    { title: 'Senior Media Sales Executive', views: 84, applications: 12 },
    { title: 'Digital Advertising Account Manager', views: 61, applications: 9 },
    { title: 'Radio Ad Sales Representative', views: 38, applications: 4 },
  ],
  applicationsByStatus: [
    { name: 'Applied', value: 12 }, { name: 'Shortlisted', value: 8 }, { name: 'Interviewed', value: 4 }, { name: 'Hired', value: 3 },
  ],
  conversionRate: 11,
};

export const MOCK_EMPLOYER_MESSAGES = [
  { id: 'm1', senderId: 'c1', subject: 'Application follow-up', body: 'Thank you for considering my application. I am very interested in the role.', read: true, sentAt: ago(1), sender: { id: 'c1', applicantProfile: { fullName: 'Kwame Asante' } } },
  { id: 'm2', senderId: 'c2', subject: 'Schedule confirmation', body: 'I can confirm the interview date works for me. Looking forward to it.', read: false, sentAt: ago(2), sender: { id: 'c2', applicantProfile: { fullName: 'Abena Mensah' } } },
];

export const MOCK_EMPLOYER_BILLING = {
  subscriptionTier: 'FREE',
  subscriptionExpiry: undefined,
  paymentHistory: [
    { id: 'pay1', type: 'REGISTRATION', amount: 0, status: 'SUCCESS', createdAt: ago(90) },
  ],
};

// ── Mock admin sub-pages ─────────────────────────────────────────────────

export const MOCK_ADMIN_ANALYTICS_FULL = {
  overview: { totalApplicants: 523, totalEmployers: 128, totalJobs: 47, totalPlacements: 214, totalRevenue: 185600, avgDaysToPlacement: 28, conversionRate: 41 },
  monthlyTrend: [
    { month: 'Oct', applicants: 42, placements: 12, revenue: 18200 },
    { month: 'Nov', applicants: 56, placements: 18, revenue: 21500 },
    { month: 'Dec', applicants: 38, placements: 14, revenue: 16800 },
    { month: 'Jan', applicants: 61, placements: 22, revenue: 27400 },
    { month: 'Feb', applicants: 73, placements: 19, revenue: 23100 },
    { month: 'Mar', applicants: 85, placements: 26, revenue: 31200 },
  ],
  applicantsByRegion: [
    { region: 'Greater Accra', count: 245 }, { region: 'Ashanti', count: 98 }, { region: 'Western', count: 62 }, { region: 'Central', count: 48 },
  ],
  jobsByIndustry: [
    { industry: 'Television', count: 35 }, { industry: 'Radio', count: 42 }, { industry: 'Digital', count: 28 }, { industry: 'Print', count: 15 }, { industry: 'Outdoor', count: 20 },
  ],
  applicationConversion: [
    { stage: 'Applied', count: 450 }, { stage: 'Shortlisted', count: 180 }, { stage: 'Interviewed', count: 95 }, { stage: 'Offered', count: 52 }, { stage: 'Hired', count: 41 },
  ],
};

export const MOCK_ADMIN_JOBS = [
  { id: 'j1', title: 'Senior Media Sales Executive', status: 'ACTIVE', isFeatured: true, viewCount: 84, createdAt: ago(2), employer: { companyName: 'Multimedia Group' }, _count: { applications: 12 } },
  { id: 'j2', title: 'Digital Advertising Account Manager', status: 'ACTIVE', isFeatured: false, viewCount: 61, createdAt: ago(5), employer: { companyName: 'Pulse Ghana' }, _count: { applications: 9 } },
  { id: 'j3', title: 'Radio Ad Sales Representative', status: 'PENDING', isFeatured: false, viewCount: 38, createdAt: ago(7), employer: { companyName: 'Starr FM' }, _count: { applications: 4 } },
];

export const MOCK_ADMIN_PLACEMENTS = [
  { id: 'p1', status: 'ACTIVE', startDate: ago(60), salaryAgreed: 4500, revenueShareRate: 3.5, monthsRemaining: 4, applicant: { fullName: 'Esi Appiah' }, application: { job: { title: 'Radio Ad Sales Representative', employer: { companyName: 'Starr FM' } } }, _count: { payments: 2 }, paidMonths: 1 },
  { id: 'p2', status: 'COMPLETED', startDate: ago(240), salaryAgreed: 5000, revenueShareRate: 4.0, monthsRemaining: 0, applicant: { fullName: 'Kwame Asante' }, application: { job: { title: 'Senior Media Sales Executive', employer: { companyName: 'Multimedia Group' } } }, _count: { payments: 6 }, paidMonths: 6 },
];

export const MOCK_ADMIN_PAYMENTS = [
  { id: 'pay1', type: 'REGISTRATION', amount: 50, status: 'SUCCESS', channel: 'MOBILE_MONEY', paidAt: ago(5), createdAt: ago(5), payer: { email: 'kwame@test.com', applicantProfile: { fullName: 'Kwame Asante' } } },
  { id: 'pay2', type: 'REVENUE_SHARE', amount: 157.5, status: 'SUCCESS', channel: 'CARD', paidAt: ago(2), createdAt: ago(2), payer: { email: 'esi@test.com', applicantProfile: { fullName: 'Esi Appiah' } } },
  { id: 'pay3', type: 'SUBSCRIPTION', amount: 200, status: 'PENDING', createdAt: ago(1), payer: { email: 'hr@multimedia.test', mediaHouse: { companyName: 'Multimedia Group' } } },
];

export const MOCK_ADMIN_APPLICANT_USERS = [
  { id: 'u1', email: 'kwame@test.com', phone: '+233200000001', status: 'ACTIVE', role: 'APPLICANT', createdAt: ago(90), lastLoginAt: ago(1), applicantProfile: { fullName: 'Kwame Asante', completionScore: 88, region: 'Greater Accra' } },
  { id: 'u2', email: 'abena@test.com', phone: '+233200000002', status: 'ACTIVE', role: 'APPLICANT', createdAt: ago(60), lastLoginAt: ago(3), applicantProfile: { fullName: 'Abena Mensah', completionScore: 92, region: 'Greater Accra' } },
  { id: 'u3', email: 'kofi@test.com', phone: '+233200000003', status: 'SUSPENDED', role: 'APPLICANT', createdAt: ago(45), applicantProfile: { fullName: 'Kofi Boateng', completionScore: 45, region: 'Ashanti' } },
];

export const MOCK_ADMIN_EMPLOYERS = [
  { id: 'e1', companyName: 'Multimedia Group', email: 'hr@multimedia.test', phone: '+233300000001', industryType: 'Television', registrationNumber: 'REG001', kybStatus: 'APPROVED', verified: true, subscriptionTier: 'PREMIUM', createdAt: ago(180), user: { status: 'ACTIVE' } },
  { id: 'e2', companyName: 'Pulse Ghana', email: 'hr@pulse.test', phone: '+233300000002', industryType: 'Digital', registrationNumber: 'REG002', kybStatus: 'APPROVED', verified: true, subscriptionTier: 'BASIC', createdAt: ago(120), user: { status: 'ACTIVE' } },
  { id: 'e3', companyName: 'GhanaWeb Media', email: 'hr@ghanaweb.test', phone: '+233300000003', industryType: 'Digital', registrationNumber: 'REG003', kybStatus: 'PENDING', verified: false, subscriptionTier: 'FREE', createdAt: ago(5), user: { status: 'PENDING_VERIFICATION' } },
];

export const MOCK_ADMIN_AUDIT_LOG = [
  { id: 'log1', action: 'USER_LOGIN', entity: 'User', entityId: 'u1', ipAddress: '41.190.2.50', createdAt: ago(0), user: { email: 'kwame@test.com', role: 'APPLICANT' } },
  { id: 'log2', action: 'JOB_CREATED', entity: 'Job', entityId: 'j1', createdAt: ago(1), user: { email: 'hr@multimedia.test', role: 'EMPLOYER' } },
  { id: 'log3', action: 'KYB_APPROVED', entity: 'Employer', entityId: 'e1', createdAt: ago(2), user: { email: 'demo-admin@medialink.test', role: 'ADMIN' } },
  { id: 'log4', action: 'PAYMENT_RECEIVED', entity: 'Payment', entityId: 'pay1', createdAt: ago(3), user: { email: 'kwame@test.com', role: 'APPLICANT' } },
];

export const MOCK_ADMIN_CONFIGS = [
  { key: 'REGISTRATION_FEE', value: '50' },
  { key: 'DEFAULT_REVENUE_SHARE_RATE', value: '3.5' },
  { key: 'MAX_REVENUE_SHARE_MONTHS', value: '6' },
  { key: 'JOB_BOOST_PRICE', value: '100' },
];

export const MOCK_ADMIN_SKILLS = [
  { id: 'sk1', name: 'TV Sales', category: 'Media Sales', active: true },
  { id: 'sk2', name: 'Radio Sales', category: 'Media Sales', active: true },
  { id: 'sk3', name: 'Digital Advertising', category: 'Digital', active: true },
  { id: 'sk4', name: 'Outdoor/OOH', category: 'Outdoor', active: true },
  { id: 'sk5', name: 'Print Advertising', category: 'Print', active: false },
];

// ── Mock admin analytics ─────────────────────────────────────────────────

export const MOCK_ADMIN_ANALYTICS = {
  totalApplicants: 523,
  totalEmployers: 128,
  activeJobs: 47,
  totalPlacements: 214,
  activePlacements: 31,
  totalRevenue: 185600,
  revenueThisMonth: 24300,
  pendingKyb: 5,
  overduePayments: 3,
  conversionRate: 41,
  avgDaysToPlacement: 28,
  monthlyTrend: [
    { month: 'Oct', applicants: 42, placements: 12, revenue: 18200 },
    { month: 'Nov', applicants: 56, placements: 18, revenue: 21500 },
    { month: 'Dec', applicants: 38, placements: 14, revenue: 16800 },
    { month: 'Jan', applicants: 61, placements: 22, revenue: 27400 },
    { month: 'Feb', applicants: 73, placements: 19, revenue: 23100 },
    { month: 'Mar', applicants: 85, placements: 26, revenue: 31200 },
  ],
};
