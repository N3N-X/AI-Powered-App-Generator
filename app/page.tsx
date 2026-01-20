import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingCTA } from "@/components/landing/cta";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
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
        <div
          className="absolute top-10 right-20 w-[300px] h-[300px] bg-gradient-radial from-green-400/8 via-green-300/4 to-transparent rounded-full blur-[80px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-gradient-radial from-rose-400/6 via-rose-300/3 to-transparent rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <LandingNavbar />

      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
