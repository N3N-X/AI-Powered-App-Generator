import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

export function ContactInfoCards() {
  return (
    <div className="lg:col-span-1 space-y-6">
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Email Us
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                Our support team is here to help
              </p>
              <a
                href="mailto:support@rulxy.com"
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                support@rulxy.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex-shrink-0">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Call Us
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                To access priority support, please ensure a phone number is
                registered to your account.
              </p>
              <a
                href="tel:+14153663668"
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                +1 (415) 366-3668
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex-shrink-0">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Visit Us
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                28 Geary St, Suite 650
                <br />
                PMB 5261
                <br />
                San Francisco, CA 94108
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
