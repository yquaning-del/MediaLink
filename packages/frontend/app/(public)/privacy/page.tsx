export const metadata = {
  title: 'Privacy Policy | MediaLink Ghana',
  description: 'MediaLink Ghana Privacy Policy — how we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  return (
    <main className="py-16 lg:py-24">
      <div className="container mx-auto px-4 max-w-3xl prose prose-brand">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: April 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly when creating an account, building your profile,
          applying for positions, or contacting us. This includes your name, email, phone number,
          work experience, education, skills, and uploaded documents (CVs, certificates).
        </p>
        <p>
          For employers, we collect company registration details, contact information, and KYB
          (Know Your Business) verification documents.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Match applicants with relevant job listings using our AI-powered matching engine</li>
          <li>Process payments via Paystack (registration fees, revenue share, subscriptions)</li>
          <li>Send notifications via SMS (Arkesel) and email (SendGrid) about applications, placements, and payments</li>
          <li>Improve our platform through analytics and usage patterns</li>
          <li>Comply with legal obligations under the Ghana Data Protection Act, 2012 (Act 843)</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>
          We share applicant profiles with employers only when an applicant applies for a job or is
          matched by our system. We do not sell personal data to third parties. We share data with
          payment processors (Paystack) solely for transaction processing.
        </p>

        <h2>4. Data Storage and Security</h2>
        <p>
          Your data is stored securely using encrypted databases and AWS S3 for documents. We
          implement industry-standard security measures including HTTPS encryption, JWT-based
          authentication, two-factor authentication (2FA), and regular security audits.
        </p>

        <h2>5. Your Rights</h2>
        <p>Under the Ghana Data Protection Act, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Withdraw consent for data processing</li>
          <li>Lodge a complaint with the Data Protection Commission</li>
        </ul>

        <h2>6. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. We do not use
          third-party tracking cookies. You can manage cookie preferences in your browser settings.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. Upon account deletion, personal
          data is removed within 30 days, except where retention is required by law (e.g., payment
          records for tax purposes are retained for 7 years).
        </p>

        <h2>8. Contact Us</h2>
        <p>
          For privacy-related inquiries, contact our Data Protection Officer at{' '}
          <a href="mailto:privacy@medialink.com.gh">privacy@medialink.com.gh</a> or call +233 XX XXX XXXX.
        </p>
      </div>
    </main>
  );
}
