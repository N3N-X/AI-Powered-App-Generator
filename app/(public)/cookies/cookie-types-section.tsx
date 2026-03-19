export function CookieTypesSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Types of Cookies We Use
      </h2>
      <div className="space-y-6">
        <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            1. Strictly Necessary Cookies
          </h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
            These cookies are essential for the website to function
            properly. They enable core functionality such as security,
            authentication, and accessibility features.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white">
                Examples:
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
              <li>Authentication cookies (session management)</li>
              <li>Security cookies (CSRF protection)</li>
              <li>Load balancing cookies</li>
              <li>Cookie consent preferences</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-400 mt-3">
              <strong className="text-gray-900 dark:text-white">
                Duration:
              </strong>{" "}
              Session or up to 1 year
            </p>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            2. Functional Cookies
          </h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
            These cookies allow us to remember your preferences and choices
            to provide enhanced, personalized features.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white">
                Examples:
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
              <li>Theme preferences (light/dark mode)</li>
              <li>Language settings</li>
              <li>Dashboard layout preferences</li>
              <li>Editor settings and configurations</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-400 mt-3">
              <strong className="text-gray-900 dark:text-white">
                Duration:
              </strong>{" "}
              Up to 2 years
            </p>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            3. Analytics and Performance Cookies
          </h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
            These cookies help us understand how visitors interact with our
            website by collecting and reporting information anonymously.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white">
                Examples:
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
              <li>Google Analytics cookies</li>
              <li>Page view tracking</li>
              <li>Feature usage statistics</li>
              <li>Error tracking and debugging</li>
              <li>Performance monitoring</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-400 mt-3">
              <strong className="text-gray-900 dark:text-white">
                Third Parties:
              </strong>{" "}
              Google Analytics, Sentry
            </p>
            <p className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white">
                Duration:
              </strong>{" "}
              Up to 2 years
            </p>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            4. Advertising and Marketing Cookies
          </h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
            These cookies track your browsing habits to deliver relevant
            advertisements and measure campaign effectiveness.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white">
                Examples:
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
              <li>Conversion tracking</li>
              <li>Remarketing pixels</li>
              <li>Social media advertising cookies</li>
              <li>A/B testing cookies</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-400 mt-3">
              <strong className="text-gray-900 dark:text-white">
                Third Parties:
              </strong>{" "}
              As applicable based on active campaigns
            </p>
            <p className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white">
                Duration:
              </strong>{" "}
              Up to 2 years
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
