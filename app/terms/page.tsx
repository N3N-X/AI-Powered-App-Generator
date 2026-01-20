import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export default function TermsPage() {
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
            Terms of Service
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
              Agreement to Terms
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you
              and RUX, Inc. (&quot;RUX,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) concerning your access to and use of the
              RUX platform and services. By accessing or using our services, you agree to be bound by these
              Terms. If you do not agree to these Terms, you may not access or use our services.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Account Registration and Security
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Eligibility
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  You must be at least 13 years old to use RUX. If you are under 18, you represent that
                  you have obtained parental or guardian consent to use our services. By creating an account,
                  you represent that all information you provide is accurate and complete.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Account Responsibilities
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-2">
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access or security breach</li>
                  <li>Ensuring your account information remains accurate and up-to-date</li>
                  <li>Compliance with all applicable laws and regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Use of Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Use of Services
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  License Grant
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable,
                  revocable license to access and use RUX for your personal or commercial purposes in
                  accordance with these Terms and your subscription plan.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Acceptable Use
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-2">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
                  <li>Use our services for any illegal or unauthorized purpose</li>
                  <li>Violate any laws, regulations, or third-party rights</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems or networks</li>
                  <li>Reverse engineer, decompile, or disassemble any part of our services</li>
                  <li>Use automated systems to access our services (except with permission)</li>
                  <li>Interfere with or disrupt the integrity or performance of our services</li>
                  <li>Create derivative works based on our services without authorization</li>
                  <li>Remove or modify any proprietary notices or labels</li>
                  <li>Use our services to compete with us or develop competing products</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              User Content and Intellectual Property
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Your Content
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  You retain all rights to the content, code, and projects you create using RUX
                  (&quot;User Content&quot;). By using our services, you grant us a worldwide, non-exclusive,
                  royalty-free license to host, store, process, and display your User Content solely to
                  provide and improve our services.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Our Intellectual Property
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  All rights, title, and interest in RUX, including our AI models, technology, software,
                  trademarks, and other intellectual property, remain our exclusive property. These Terms
                  do not grant you any rights to our intellectual property except as explicitly stated.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Generated Code
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Code generated by RUX&apos;s AI is provided to you under the license terms of your
                  subscription. You own the code generated for your projects and may use it for any
                  lawful purpose, subject to applicable open-source licenses of any included dependencies.
                </p>
              </div>
            </div>
          </section>

          {/* Subscription and Payment */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Subscription and Payment Terms
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Subscription Plans
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  RUX offers various subscription plans with different features and usage limits.
                  Plan details, pricing, and features are available on our pricing page and may be
                  updated periodically with reasonable notice.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Payment and Billing
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-2">
                  By subscribing to a paid plan:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 ml-4">
                  <li>You authorize us to charge your payment method on a recurring basis</li>
                  <li>Payments are processed through secure third-party payment processors</li>
                  <li>All fees are non-refundable except as required by law or stated in our refund policy</li>
                  <li>You are responsible for applicable taxes</li>
                  <li>Failed payments may result in service suspension or termination</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Cancellation and Refunds
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  You may cancel your subscription at any time from your account settings. Cancellations
                  take effect at the end of the current billing period. We offer a 14-day money-back
                  guarantee for new subscribers. Refund requests must be submitted to{" "}
                  <a href="mailto:billing@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">
                    billing@rux.dev
                  </a>.
                </p>
              </div>
            </div>
          </section>

          {/* Service Level */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Service Availability and Support
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                We strive to maintain high availability of our services but do not guarantee uninterrupted
                access. We may perform maintenance, updates, or modifications that temporarily affect service
                availability. We are not liable for any downtime, service interruptions, or data loss.
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                Support is provided according to your subscription plan. Enterprise customers may have
                dedicated support channels and service level agreements (SLAs).
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Termination
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                Either party may terminate these Terms at any time. We reserve the right to suspend or
                terminate your account immediately if you violate these Terms, engage in fraudulent
                activity, or for any other reason at our discretion.
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                Upon termination, your right to use our services ceases immediately. You may download
                your User Content within 30 days of termination, after which we may delete your data.
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Disclaimers and Limitations of Liability
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Service Disclaimer
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  RUX IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                  EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR
                  A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL
                  BE ERROR-FREE, SECURE, OR UNINTERRUPTED.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  AI-Generated Content
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  AI-generated code and content may contain errors, bugs, or security vulnerabilities.
                  You are responsible for reviewing, testing, and validating all generated code before
                  deployment. We are not liable for any damages resulting from the use of AI-generated content.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Limitation of Liability
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, RUX SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS,
                  DATA LOSS, OR BUSINESS INTERRUPTION. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT
                  YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Indemnification
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              You agree to indemnify, defend, and hold harmless RUX and its officers, directors, employees,
              and agents from any claims, damages, losses, liabilities, and expenses (including legal fees)
              arising from your use of our services, violation of these Terms, or infringement of any rights
              of another party.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Dispute Resolution and Governing Law
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Governing Law
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  These Terms are governed by the laws of the State of California, United States,
                  without regard to conflict of law provisions.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Arbitration
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Any disputes arising from these Terms or your use of our services shall be resolved
                  through binding arbitration in accordance with the American Arbitration Association&apos;s
                  rules, except where prohibited by law. You waive any right to participate in class
                  action lawsuits or class-wide arbitration.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to These Terms
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We may modify these Terms at any time. Material changes will be notified via email or
              through our platform. Your continued use of RUX after changes take effect constitutes
              acceptance of the modified Terms. If you do not agree to the changes, you must stop using
              our services.
            </p>
          </section>

          {/* Miscellaneous */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Miscellaneous
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between
                you and RUX regarding our services.
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                <strong>Severability:</strong> If any provision is found unenforceable, the remaining
                provisions remain in effect.
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                <strong>Waiver:</strong> No waiver of any term shall be deemed a further or continuing
                waiver of such term or any other term.
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                <strong>Assignment:</strong> You may not assign these Terms without our prior written
                consent. We may assign these Terms without restriction.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-gray-600 dark:text-slate-400">
              <p><strong>Email:</strong> <a href="mailto:legal@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">legal@rux.dev</a></p>
              <p><strong>Address:</strong> RUX, Inc., 123 Innovation Drive, San Francisco, CA 94105</p>
              <p><strong>Support:</strong> <a href="mailto:support@rux.dev" className="text-violet-600 dark:text-violet-400 hover:underline">support@rux.dev</a></p>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
