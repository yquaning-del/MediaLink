export const metadata = {
  title: 'Terms of Service | MediaLink Ghana',
  description: 'MediaLink Ghana Terms of Service — the rules governing your use of our platform.',
};

export default function TermsPage() {
  return (
    <main className="py-16 lg:py-24">
      <div className="container mx-auto px-4 max-w-3xl prose prose-brand">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: April 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using MediaLink Ghana (&quot;the Platform&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, do not use the Platform.
        </p>

        <h2>2. User Accounts</h2>
        <p>
          You must provide accurate, complete information when registering. You are responsible for
          maintaining the confidentiality of your account credentials. Each person may only maintain
          one account. Applicant accounts require a one-time GHC 50 registration fee.
        </p>

        <h2>3. Applicant Obligations</h2>
        <ul>
          <li>Provide truthful profile information including work experience, skills, and education</li>
          <li>Pay the registration fee and any applicable revenue-share fees upon successful placement</li>
          <li>Revenue share: 10% of monthly salary for 6 months following a successful placement</li>
          <li>Respond to employer communications and interview invitations in a timely manner</li>
        </ul>

        <h2>4. Employer Obligations</h2>
        <ul>
          <li>Complete KYB (Know Your Business) verification before posting jobs</li>
          <li>Post accurate job descriptions, compensation, and requirements</li>
          <li>Treat all applicants fairly and without discrimination</li>
          <li>Maintain an active subscription to access premium features</li>
        </ul>

        <h2>5. Payments</h2>
        <p>
          All payments are processed securely through Paystack. Registration fees are non-refundable.
          Revenue-share payments are due on the agreed schedule. Subscription payments are billed
          monthly. Failure to pay may result in account suspension.
        </p>

        <h2>6. Prohibited Conduct</h2>
        <ul>
          <li>Submitting false or misleading information</li>
          <li>Circumventing the platform to hire or be hired directly</li>
          <li>Harassing, threatening, or discriminating against other users</li>
          <li>Attempting to access other users&apos; accounts or data</li>
          <li>Using automated tools to scrape or extract data from the Platform</li>
        </ul>

        <h2>7. Intellectual Property</h2>
        <p>
          All content, branding, and technology of MediaLink Ghana is owned by us. You retain
          ownership of your profile content but grant us a license to display it to potential
          employers or candidates as part of the platform&apos;s matching functionality.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          MediaLink Ghana is a recruitment platform and does not guarantee employment outcomes.
          We are not liable for disputes between applicants and employers, salary negotiations,
          or employment decisions made by either party.
        </p>

        <h2>9. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms. You may
          delete your account at any time through your settings page. Outstanding payment
          obligations survive termination.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the Republic of Ghana. Disputes shall be
          resolved through arbitration in Accra, Ghana.
        </p>

        <h2>11. Contact</h2>
        <p>
          For questions about these Terms, contact us at{' '}
          <a href="mailto:legal@medialink.com.gh">legal@medialink.com.gh</a>.
        </p>
      </div>
    </main>
  );
}
