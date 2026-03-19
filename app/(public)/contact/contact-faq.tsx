import { Card, CardContent } from "@/components/ui/card";

export function ContactFAQ() {
  return (
    <Card className="rounded-3xl mt-8">
      <CardContent className="p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              What is your typical response time?
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              We typically respond to all inquiries within 24 hours during
              business days. Enterprise customers receive priority support with
              faster response times.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Do you offer phone support?
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Phone support is available for Pro and Elite plan customers. Free
              tier users can reach us via email.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              How can I report a bug or security issue?
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              For bug reports, please use this contact form or email us at
              bugs@rulxy.com. For security vulnerabilities, please email
              security@rulxy.com directly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
