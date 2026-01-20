import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export default function CookiesPage() {
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
            Cookie Policy
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
              What Are Cookies?
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit our website.
              They help us provide you with a better experience by remembering your preferences,
              understanding how you use our services, and improving our platform. This Cookie Policy
              explains how RUX uses cookies and similar tracking technologies.
            </p>
          </section>

          {/* Types of Cookies */}
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
                  These cookies are essential for the website to function properly. They enable core
                  functionality such as security, authentication, and accessibility features.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-slate-400">
                    <strong className="text-gray-900 dark:text-white">Examples:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
                    <li>Authentication cookies (session management)</li>
                    <li>Security cookies (CSRF protection)</li>
                    <li>Load balancing cookies</li>
                    <li>Cookie consent preferences</li>
                  </ul>
                  <p className="text-gray-600 dark:text-slate-400 mt-3">
                    <strong className="text-gray-900 dark:text-white">Duration:</strong> Session or up to 1 year
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Functional Cookies
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                  These cookies allow us to remember your preferences and choices to provide enhanced,
                  personalized features.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-slate-400">
                    <strong className="text-gray-900 dark:text-white">Examples:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
                    <li>Theme preferences (light/dark mode)</li>
                    <li>Language settings</li>
                    <li>Dashboard layout preferences</li>
                    <li>Editor settings and configurations</li>
                  </ul>
                  <p className="text-gray-600 dark:text-slate-400 mt-3">
                    <strong className="text-gray-900 dark:text-white">Duration:</strong> Up to 2 years
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. Analytics and Performance Cookies
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                  These cookies help us understand how visitors interact with our website by collecting
                  and reporting information anonymously.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-slate-400">
                    <strong className="text-gray-900 dark:text-white">Examples:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
                    <li>Google Analytics cookies</li>
                    <li>Page view tracking</li>
                    <li>Feature usage statistics</li>
                    <li>Error tracking and debugging</li>
                    <li>Performance monitoring</li>
                  </ul>
                  <p className="text-gray-600 dark:text-slate-400 mt-3">
                    <strong className="text-gray-900 dark:text-white">Third Parties:</strong> Google Analytics, Sentry
                  </p>
                  <p className="text-gray-600 dark:text-slate-400">
                    <strong className="text-gray-900 dark:text-white">Duration:</strong> Up to 2 years
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Advertising and Marketing Cookies
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                  These cookies track your browsing habits to deliver relevant advertisements and measure
                  campaign effectiveness.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-slate-400">
                    <strong className="text-gray-900 dark:text-white">Examples:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-400 ml-4">
                    <li>Conversion tracking</li>
                    <li>Remarketing pixels</li>
                    <li>Social media advertising cookies</li>
                    <li>A/B testing cookies</li>
                  </ul>
                  <p className="text-gray-600 dark:text-slate-400 mt-3">
                    <strong className="text-gray-900 dark:text-white">Third Parties:</strong> Google Ads, Facebook Pixel, LinkedIn Insight Tag
                  </p>
                  <p className="text-gray-600 dark:text-slate-400">
                    <strong className="text-gray-900 dark:text-white">Duration:</strong> Up to 2 years
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Cookies
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              We use cookies from trusted third-party services to enhance functionality and analyze usage.
              These third parties may also use cookies subject to their own privacy policies:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold">Google Analytics</p>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    For website analytics and usage statistics
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold">Clerk</p>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    For authentication and user management
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold">Stripe</p>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    For secure payment processing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold">Vercel Analytics</p>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    For performance monitoring and analytics
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold">Intercom</p>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    For customer support and messaging
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Cookie Table */}
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
                    <td className="py-3 px-4 font-mono text-xs">__clerk_*</td>
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
                    <td className="py-3 px-4">Google Analytics - User tracking</td>
                    <td className="py-3 px-4">2 years</td>
                  </tr>
                  <tr className="border-b border-gray-200/30 dark:border-white/5">
                    <td className="py-3 px-4 font-mono text-xs">_gid</td>
                    <td className="py-3 px-4">Google Analytics - Session tracking</td>
                    <td className="py-3 px-4">24 hours</td>
                  </tr>
                  <tr className="border-b border-gray-200/30 dark:border-white/5">
                    <td className="py-3 px-4 font-mono text-xs">cookie_consent</td>
                    <td className="py-3 px-4">Store cookie preferences</td>
                    <td className="py-3 px-4">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Managing Cookies */}
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
                  You can manage your cookie preferences through our cookie consent banner that appears
                  when you first visit our website. You can change your preferences at any time through
                  your account settings or by clearing your browser cookies.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Browser Settings
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                  Most web browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
                  <li>Block all cookies</li>
                  <li>Block third-party cookies only</li>
                  <li>Delete cookies after each browsing session</li>
                  <li>Set exceptions for specific websites</li>
                </ul>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mt-4">
                  Please note that blocking or deleting cookies may impact your ability to use certain
                  features of our platform.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Browser-Specific Instructions
                </h3>
                <div className="space-y-2 text-gray-600 dark:text-slate-400">
                  <p>
                    <strong className="text-gray-900 dark:text-white">Chrome:</strong>{" "}
                    Settings → Privacy and security → Cookies and other site data
                  </p>
                  <p>
                    <strong className="text-gray-900 dark:text-white">Firefox:</strong>{" "}
                    Settings → Privacy & Security → Cookies and Site Data
                  </p>
                  <p>
                    <strong className="text-gray-900 dark:text-white">Safari:</strong>{" "}
                    Preferences → Privacy → Manage Website Data
                  </p>
                  <p>
                    <strong className="text-gray-900 dark:text-white">Edge:</strong>{" "}
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Do Not Track */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Do Not Track Signals
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Some browsers include a &quot;Do Not Track&quot; (DNT) feature that signals to websites that you do not
              want to be tracked. We respect DNT signals and will not track users who have enabled this
              feature in their browser settings for non-essential cookies.
            </p>
          </section>

          {/* Mobile Devices */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Mobile Devices and Apps
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              When you use our mobile applications or access our services through mobile browsers, we may
              use similar technologies to cookies, such as mobile device identifiers and SDKs. You can
              manage these through your device settings:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4 mt-4">
              <li><strong className="text-gray-900 dark:text-white">iOS:</strong> Settings → Privacy → Tracking</li>
              <li><strong className="text-gray-900 dark:text-white">Android:</strong> Settings → Google → Ads</li>
            </ul>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Cookie Policy
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or
              for other operational, legal, or regulatory reasons. We will notify you of any material
              changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="space-y-2 text-gray-600 dark:text-slate-400">
              <p><strong>Email:</strong> <a href="mailto:privacy@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">privacy@rux.dev</a></p>
              <p><strong>Privacy Page:</strong> <a href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">RUX Privacy Policy</a></p>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
