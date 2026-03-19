export function IntroductionSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Introduction
      </h2>
      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
        Welcome to RUX. We respect your privacy and are committed to protecting
        your personal data. This privacy policy will inform you about how we
        look after your personal data when you visit our website and use our
        services, and tell you about your privacy rights and how the law
        protects you.
      </p>
    </section>
  );
}

export function DataCollectionSection() {
  return (
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
            <li>
              Payment information (processed securely through third-party
              payment processors)
            </li>
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
            <li>
              Device information (IP address, browser type, operating system)
            </li>
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
            When you use RUX to create applications, we store your project code,
            configurations, and related files. This data is necessary to provide
            our AI-powered development services and is encrypted both in transit
            and at rest.
          </p>
        </div>
      </div>
    </section>
  );
}

export function DataUsageSection() {
  return (
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
        <li>
          To communicate with you about updates, security alerts, and support
        </li>
        <li>
          To personalize your experience and provide tailored recommendations
        </li>
        <li>To train and improve our AI models (using anonymized data)</li>
        <li>To detect and prevent fraud, abuse, and security incidents</li>
        <li>To comply with legal obligations and enforce our terms</li>
        <li>To analyze usage patterns and improve our platform</li>
      </ul>
    </section>
  );
}

export function DataSharingSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Information Sharing and Disclosure
      </h2>
      <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
        We do not sell your personal information. We may share your information
        in the following circumstances:
      </p>
      <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
        <li>
          <strong>Service Providers:</strong> With trusted third-party vendors
          who assist in operating our platform (e.g., hosting, analytics,
          payment processing)
        </li>
        <li>
          <strong>Legal Requirements:</strong> When required by law or to
          protect our rights and safety
        </li>
        <li>
          <strong>Business Transfers:</strong> In connection with a merger,
          acquisition, or sale of assets
        </li>
        <li>
          <strong>With Your Consent:</strong> When you explicitly authorize us
          to share specific information
        </li>
      </ul>
    </section>
  );
}
