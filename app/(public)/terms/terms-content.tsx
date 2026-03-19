import { TermsSectionsTop } from "./terms-sections-top";
import { TermsSectionsBottom } from "./terms-sections-bottom";

export function TermsContent() {
  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 space-y-8">
      <TermsSectionsTop />
      <TermsSectionsBottom />
    </div>
  );
}
