import { Metadata } from "next";
import { CookieTypesSection } from "./cookie-types-section";
import {
  ThirdPartyCookiesSection,
  CookieTableSection,
  ManagingCookiesSection,
} from "./cookie-details-section";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Understand how Rulxy uses cookies and tracking technologies. Learn about cookie types, third-party services, and how to manage your preferences.",
  alternates: { canonical: "https://rulxy.com/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
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
            Cookies are small text files that are placed on your device when you
            visit our website. They help us provide you with a better experience
            by remembering your preferences, understanding how you use our
            services, and improving our platform. This Cookie Policy explains
            how Rulxy uses cookies and similar tracking technologies.
          </p>
        </section>

        <CookieTypesSection />
        <ThirdPartyCookiesSection />
        <CookieTableSection />
        <ManagingCookiesSection />

        {/* Do Not Track */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Do Not Track Signals
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Some browsers include a &quot;Do Not Track&quot; (DNT) feature that
            signals to websites that you do not want to be tracked. We respect
            DNT signals and will not track users who have enabled this feature
            in their browser settings for non-essential cookies.
          </p>
        </section>

        {/* Mobile Devices */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Mobile Devices and Apps
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            When you use our mobile applications or access our services through
            mobile browsers, we may use similar technologies to cookies, such as
            mobile device identifiers and SDKs. You can manage these through
            your device settings:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4 mt-4">
            <li>
              <strong className="text-gray-900 dark:text-white">iOS:</strong>{" "}
              Settings → Privacy → Tracking
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Android:
              </strong>{" "}
              Settings → Google → Ads
            </li>
          </ul>
        </section>

        {/* Updates */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Changes to This Cookie Policy
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            We may update this Cookie Policy from time to time to reflect
            changes in our practices or for other operational, legal, or
            regulatory reasons. We will notify you of any material changes by
            posting the updated policy on this page and updating the &quot;Last
            updated&quot; date.
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
              <strong>Privacy Page:</strong>{" "}
              <a
                href="/privacy"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                Rulxy Privacy Policy
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
