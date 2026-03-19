export function ThirdPartyCookiesSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Third-Party Cookies
      </h2>
      <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
        We use cookies from trusted third-party services to enhance
        functionality and analyze usage. These third parties may also use
        cookies subject to their own privacy policies:
      </p>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">
              Google Analytics
            </p>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              For website analytics and usage statistics
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">
              Supabase
            </p>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              For authentication and user management
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">
              Stripe
            </p>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              For secure payment processing
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">
              Vercel Analytics
            </p>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              For performance monitoring and analytics
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CookieTableSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Detailed Cookie Information
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200/50 dark:border-white/10">
              <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">
                Cookie Name
              </th>
              <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">
                Purpose
              </th>
              <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-slate-400">
            <tr className="border-b border-gray-200/30 dark:border-white/5">
              <td className="py-3 px-4 font-mono text-xs">__session</td>
              <td className="py-3 px-4">User session management</td>
              <td className="py-3 px-4">Session</td>
            </tr>
            <tr className="border-b border-gray-200/30 dark:border-white/5">
              <td className="py-3 px-4 font-mono text-xs">sb-*</td>
              <td className="py-3 px-4">Authentication and security</td>
              <td className="py-3 px-4">1 year</td>
            </tr>
            <tr className="border-b border-gray-200/30 dark:border-white/5">
              <td className="py-3 px-4 font-mono text-xs">theme</td>
              <td className="py-3 px-4">Store theme preference</td>
              <td className="py-3 px-4">2 years</td>
            </tr>
            <tr className="border-b border-gray-200/30 dark:border-white/5">
              <td className="py-3 px-4 font-mono text-xs">_ga</td>
              <td className="py-3 px-4">
                Google Analytics - User tracking
              </td>
              <td className="py-3 px-4">2 years</td>
            </tr>
            <tr className="border-b border-gray-200/30 dark:border-white/5">
              <td className="py-3 px-4 font-mono text-xs">_gid</td>
              <td className="py-3 px-4">
                Google Analytics - Session tracking
              </td>
              <td className="py-3 px-4">24 hours</td>
            </tr>
            <tr className="border-b border-gray-200/30 dark:border-white/5">
              <td className="py-3 px-4 font-mono text-xs">
                cookie_consent
              </td>
              <td className="py-3 px-4">Store cookie preferences</td>
              <td className="py-3 px-4">1 year</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ManagingCookiesSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        How to Manage Cookies
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cookie Preferences
          </h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            You can manage your cookie preferences through our cookie
            consent banner that appears when you first visit our website.
            You can change your preferences at any time through your account
            settings or by clearing your browser cookies.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Browser Settings
          </h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
            Most web browsers allow you to control cookies through their
            settings. You can:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
            <li>Block all cookies</li>
            <li>Block third-party cookies only</li>
            <li>Delete cookies after each browsing session</li>
            <li>Set exceptions for specific websites</li>
          </ul>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mt-4">
            Please note that blocking or deleting cookies may impact your
            ability to use certain features of our platform.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Browser-Specific Instructions
          </h3>
          <div className="space-y-2 text-gray-600 dark:text-slate-400">
            <p>
              <strong className="text-gray-900 dark:text-white">
                Chrome:
              </strong>{" "}
              Settings → Privacy and security → Cookies and other site data
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">
                Firefox:
              </strong>{" "}
              Settings → Privacy & Security → Cookies and Site Data
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">
                Safari:
              </strong>{" "}
              Preferences → Privacy → Manage Website Data
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">
                Edge:
              </strong>{" "}
              Settings → Cookies and site permissions → Cookies and site
              data
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
