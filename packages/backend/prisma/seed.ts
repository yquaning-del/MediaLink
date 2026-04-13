import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SKILLS = [
  // Sales Skills
  { name: 'Cold Calling', category: 'Sales' },
  { name: 'Consultative Selling', category: 'Sales' },
  { name: 'B2B Sales', category: 'Sales' },
  { name: 'B2C Sales', category: 'Sales' },
  { name: 'Account Management', category: 'Sales' },
  { name: 'Lead Generation', category: 'Sales' },
  { name: 'Pipeline Management', category: 'Sales' },
  { name: 'Upselling & Cross-Selling', category: 'Sales' },
  { name: 'Sales Presentations', category: 'Sales' },
  { name: 'CRM Software (Salesforce)', category: 'Sales' },
  { name: 'CRM Software (HubSpot)', category: 'Sales' },
  { name: 'CRM Software (Zoho)', category: 'Sales' },
  // Advertising Skills
  { name: 'Media Planning', category: 'Advertising' },
  { name: 'Ad Trafficking', category: 'Advertising' },
  { name: 'Programmatic Advertising', category: 'Advertising' },
  { name: 'Google Ads', category: 'Advertising' },
  { name: 'Facebook/Meta Ads', category: 'Advertising' },
  { name: 'Out-of-Home (OOH) Advertising', category: 'Advertising' },
  { name: 'Radio Ad Sales', category: 'Advertising' },
  { name: 'TV Airtime Sales', category: 'Advertising' },
  { name: 'Sponsorship Sales', category: 'Advertising' },
  { name: 'Event Marketing', category: 'Advertising' },
  // Digital Marketing
  { name: 'SEO', category: 'Digital Marketing' },
  { name: 'SEM', category: 'Digital Marketing' },
  { name: 'Content Marketing', category: 'Digital Marketing' },
  { name: 'Social Media Management', category: 'Digital Marketing' },
  { name: 'Email Marketing', category: 'Digital Marketing' },
  { name: 'Influencer Marketing', category: 'Digital Marketing' },
  { name: 'Analytics (Google Analytics)', category: 'Digital Marketing' },
  { name: 'Analytics (Data Studio)', category: 'Digital Marketing' },
  // Soft Skills
  { name: 'Negotiation', category: 'Soft Skills' },
  { name: 'Client Relationship Management', category: 'Soft Skills' },
  { name: 'Communication', category: 'Soft Skills' },
  { name: 'Presentation', category: 'Soft Skills' },
  { name: 'Teamwork', category: 'Soft Skills' },
  { name: 'Time Management', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Northern', 'Eastern', 'Western',
  'Volta', 'Central', 'Brong-Ahafo', 'Upper East', 'Upper West',
  'Savannah', 'Bono East', 'Ahafo', 'North East', 'Western North', 'Oti',
];

async function main() {
  console.log('🌱 Seeding database...');

  // ── Skills Taxonomy ──────────────────────────────────────────
  console.log('Adding skills taxonomy...');
  await Promise.all(
    SKILLS.map((skill) =>
      prisma.skill.upsert({
        where: { name: skill.name },
        update: { active: true, category: skill.category },
        create: { name: skill.name, category: skill.category, active: true },
      })
    )
  );
  console.log(`✅ ${SKILLS.length} skills added`);

  // ── Platform Config ──────────────────────────────────────────
  const configs = [
    { key: 'DEFAULT_REVENUE_SHARE_RATE', value: '0.05' },
    { key: 'REVENUE_SHARE_MONTHS', value: '6' },
    { key: 'REGISTRATION_FEE_GHC', value: '50' },
    { key: 'PROFILE_VISIBILITY_THRESHOLD', value: '60' },
    { key: 'JOB_MATCH_THRESHOLD', value: '70' },
  ];

  await Promise.all(
    configs.map((c) =>
      prisma.platformConfig.upsert({
        where: { key: c.key },
        update: { value: c.value },
        create: { key: c.key, value: c.value },
      })
    )
  );
  console.log('✅ Platform configs set');

  // ── Super Admin ──────────────────────────────────────────────
  const adminEmail = 'admin@medialink.com.gh';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@MediaLink2025!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '0244000001',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super admin created (email: admin@medialink.com.gh, password: Admin@MediaLink2025!)');
    console.log('⚠️  CHANGE THE ADMIN PASSWORD IMMEDIATELY IN PRODUCTION!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // ── Finance Manager ──────────────────────────────────────────
  const financeEmail = 'finance@medialink.com.gh';
  const existingFinance = await prisma.user.findUnique({ where: { email: financeEmail } });

  if (!existingFinance) {
    const passwordHash = await bcrypt.hash('Finance@MediaLink2025!', 12);
    await prisma.user.create({
      data: {
        email: financeEmail,
        phone: '0244000002',
        passwordHash,
        role: 'FINANCE',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Finance manager created');
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Default credentials (change in production):');
  console.log('   Super Admin: admin@medialink.com.gh / Admin@MediaLink2025!');
  console.log('   Finance:     finance@medialink.com.gh / Finance@MediaLink2025!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
