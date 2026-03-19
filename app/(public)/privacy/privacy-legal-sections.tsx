export function SecurityAndRetentionSection() {
  return (
    <>
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Data Security
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          We implement industry-standard security measures to protect your
          personal information, including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4 mt-4">
          <li>Encryption of data in transit (TLS/SSL) and at rest</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access controls and authentication mechanisms</li>
          <li>Secure data centers with physical security measures</li>
          <li>Employee training on data protection and privacy</li>
        </ul>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed mt-4">
          However, no method of transmission over the Internet or electronic
          storage is 100% secure. While we strive to protect your information,
          we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Data Retention
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          We retain your personal information for as long as necessary to
          provide our services and fulfill the purposes outlined in this policy.
          When you close your account, we will delete or anonymize your personal
          data within 90 days, except where we are required to retain it for
          legal, tax, or regulatory purposes.
        </p>
      </section>
    </>
  );
}

export function RightsAndCookiesSection() {
  return (
    <>
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Privacy Rights
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
          Depending on your location, you may have the following rights
          regarding your personal data:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
          <li>
            <strong>Access:</strong> Request a copy of your personal information
          </li>
          <li>
            <strong>Correction:</strong> Update or correct inaccurate
            information
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data
          </li>
          <li>
            <strong>Portability:</strong> Receive your data in a portable format
          </li>
          <li>
            <strong>Restriction:</strong> Request limited processing of your
            data
          </li>
          <li>
            <strong>Objection:</strong> Object to certain processing activities
          </li>
          <li>
            <strong>Withdraw Consent:</strong> Withdraw previously given consent
          </li>
        </ul>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed mt-4">
          To exercise these rights, please contact us at{" "}
          <a
            href="mailto:privacy@rulxy.com"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            privacy@rulxy.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Cookies and Tracking Technologies
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          We use cookies and similar tracking technologies to enhance your
          experience, analyze usage, and provide personalized content. For more
          detailed information about our use of cookies, please refer to our{" "}
          <a
            href="/cookies"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            Cookie Policy
          </a>
          .
        </p>
      </section>
    </>
  );
}

export function LegalSection() {
  return (
    <>
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Third-Party Services
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          Our platform may contain links to third-party websites and services.
          We are not responsible for the privacy practices of these external
          sites. We encourage you to review their privacy policies before
          providing any personal information.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Children&apos;s Privacy
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          RUX is not intended for users under the age of 13. We do not knowingly
          collect personal information from children. If we become aware that we
          have collected personal information from a child under 13, we will
          take steps to delete such information.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          International Data Transfers
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          Your information may be transferred to and processed in countries
          other than your country of residence. These countries may have
          different data protection laws. We ensure appropriate safeguards are
          in place to protect your personal data in accordance with this privacy
          policy.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Changes to This Privacy Policy
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
          We may update this privacy policy from time to time. We will notify
          you of any material changes by posting the new policy on this page and
          updating the &quot;Last updated&quot; date. We encourage you to review
          this policy periodically for any changes.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Contact Us
        </h2>
        <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
          If you have any questions or concerns about this privacy policy or our
          data practices, please contact us:
        </p>
        <div className="space-y-2 text-gray-600 dark:text-slate-400">
          <p>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:privacy@rulxy.com"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              privacy@rulxy.com
            </a>
          </p>
          <p>
            <strong>Address:</strong> RUX LLC, 28 Geary St, Suite 650, PMB 5261,
            San Francisco, CA 94108
          </p>
          <p>
            <strong>Data Protection Officer:</strong>{" "}
            <a
              href="mailto:dpo@rulxy.com"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              dpo@rulxy.com
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
