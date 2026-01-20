import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      {/* Liquid Glass Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-[140px] animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-purple-400/12 via-purple-300/6 to-transparent rounded-full blur-[160px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-cyan-300/5 via-transparent to-transparent rounded-full blur-[100px]" />
      </div>

      <LandingNavbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-400">
            Last updated: January 20, 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Welcome to RUX. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you visit
              our website and use our services, and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Personal Information
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-2">
                  We collect personal information that you provide to us, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials (username, password)</li>
                  <li>Payment information (processed securely through third-party payment processors)</li>
                  <li>Profile information and preferences</li>
                  <li>Communication history with our support team</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Usage Data
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-2">
                  We automatically collect information about your use of our services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>API usage and project metrics</li>
                  <li>Log data and error reports</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Project Data
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  When you use RUX to create applications, we store your project code, configurations,
                  and related files. This data is necessary to provide our AI-powered development services
                  and is encrypted both in transit and at rest.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              We use your personal information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
              <li>To provide, maintain, and improve our services</li>
              <li>To process your transactions and manage your account</li>
              <li>To communicate with you about updates, security alerts, and support</li>
              <li>To personalize your experience and provide tailored recommendations</li>
              <li>To train and improve our AI models (using anonymized data)</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
              <li>To comply with legal obligations and enforce our terms</li>
              <li>To analyze usage patterns and improve our platform</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information Sharing and Disclosure
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our platform (e.g., hosting, analytics, payment processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data Security
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4 mt-4">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data centers with physical security measures</li>
              <li>Employee training on data protection and privacy</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data Retention
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and
              fulfill the purposes outlined in this policy. When you close your account, we will delete
              or anonymize your personal data within 90 days, except where we are required to retain it
              for legal, tax, or regulatory purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Privacy Rights
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Restriction:</strong> Request limited processing of your data</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:privacy@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">
                privacy@rux.dev
              </a>
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage,
              and provide personalized content. For more detailed information about our use of cookies,
              please refer to our{" "}
              <a href="/cookies" className="text-violet-600 dark:text-violet-400 hover:underline">
                Cookie Policy
              </a>.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Our platform may contain links to third-party websites and services. We are not responsible
              for the privacy practices of these external sites. We encourage you to review their privacy
              policies before providing any personal information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              RUX is not intended for users under the age of 13. We do not knowingly collect personal
              information from children. If we become aware that we have collected personal information
              from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              International Data Transfers
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country
              of residence. These countries may have different data protection laws. We ensure appropriate
              safeguards are in place to protect your personal data in accordance with this privacy policy.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any material
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              We encourage you to review this policy periodically for any changes.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              If you have any questions or concerns about this privacy policy or our data practices,
              please contact us:
            </p>
            <div className="space-y-2 text-gray-600 dark:text-slate-400">
              <p><strong>Email:</strong> <a href="mailto:privacy@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">privacy@rux.dev</a></p>
              <p><strong>Address:</strong> RUX, Inc., 123 Innovation Drive, San Francisco, CA 94105</p>
              <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">dpo@rux.dev</a></p>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
