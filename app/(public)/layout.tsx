import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { PageTransition } from "@/components/landing/page-transition";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Atmospheric background glow — fixed, always visible */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Large violet wash from top */}
        <div className="absolute left-1/2 top-[-300px] h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-[180px]" />
        {/* Cyan orb - right side */}
        <div className="absolute right-[-150px] top-[15%] h-[500px] w-[500px] rounded-full bg-cyan-400/15 blur-[140px]" />
        {/* Violet orb - left side, floating */}
        <div className="absolute left-[-100px] top-[40%] h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[120px] liquid-float" />
        {/* Bottom violet glow */}
        <div className="absolute bottom-[-200px] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[160px]" />
        {/* Center subtle cyan */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-[100px]" />
      </div>

      {/* Content above the glow */}
      <div className="relative z-10">
        <LandingNavbar />

        <main>
          <PageTransition>{children}</PageTransition>
        </main>

        <LandingFooter />
      </div>
    </div>
  );
}
