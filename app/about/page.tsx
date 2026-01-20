import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { Sparkles, Zap, Users, Globe, Shield, Rocket } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
      </div>

      <LandingNavbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            About RUX
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
            Empowering developers to build better applications faster with the
            power of AI
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed text-center max-w-3xl mx-auto">
            RUX is on a mission to democratize application development by making
            it accessible to everyone, regardless of their technical background.
            We believe that great ideas should not be limited by coding skills,
            and that developers should be able to focus on creativity and
            innovation rather than repetitive tasks.
          </p>
        </div>

        {/* What is RUX */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            What is RUX?
          </h2>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              RUX is an AI-powered platform that revolutionizes how web, iOS,
              and Android applications are built. Using advanced natural
              language processing and machine learning, RUX transforms your
              ideas into fully functional applications through simple
              conversations.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Instead of spending weeks or months learning complex frameworks
              and writing thousands of lines of code, you can describe what you
              want to build in plain English. Our sophisticated AI understands
              your requirements, asks clarifying questions when needed, and
              generates production-ready code that follows best practices and
              industry standards.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Whether you&apos;re a seasoned developer looking to accelerate
              your workflow, a startup founder with a vision, or someone with a
              great app idea but limited coding experience, RUX provides the
              tools and intelligence to bring your projects to life.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Innovation First
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                    We constantly push the boundaries of what&apos;s possible
                    with AI, staying at the forefront of technology to deliver
                    cutting-edge solutions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    User-Centric Design
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                    Every feature we build is designed with our users in mind,
                    ensuring an intuitive and delightful experience at every
                    touchpoint.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Security & Privacy
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                    We take data security seriously, implementing
                    industry-leading practices to protect your code, data, and
                    intellectual property.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex-shrink-0">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Global Accessibility
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                    We believe technology should be accessible to everyone,
                    everywhere, breaking down barriers to entry in software
                    development.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            How RUX Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Describe Your Idea
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Start by describing your application in natural language. Tell
                  RUX what you want to build, what features you need, and who
                  your target users are.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  AI-Powered Generation
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Our advanced AI analyzes your requirements and generates a
                  complete project structure with clean, maintainable code
                  following industry best practices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Iterate and Refine
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Review the generated code in real-time, make changes through
                  conversation, and see instant previews. Iterate until your
                  application is exactly what you envisioned.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Deploy with Confidence
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Export your project and deploy it to your preferred platform.
                  All code is production-ready with proper documentation,
                  testing, and deployment configurations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Powered by Advanced AI
          </h2>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              RUX leverages state-of-the-art artificial intelligence and machine
              learning technologies to understand your requirements and generate
              high-quality code:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  Advanced Natural Language Processing
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  Code Generation Models
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  Context-Aware Suggestions
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  Real-Time Error Detection
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  Best Practices Enforcement
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  Multi-Platform Support
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Our Story
          </h2>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              RUX was founded in 2024 by a team of experienced developers and AI
              researchers who were frustrated with the complexity and time
              investment required to build modern applications. We saw countless
              great ideas fail to materialize simply because the technical
              barriers were too high.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We envisioned a world where anyone with an idea could bring it to
              life without spending months learning programming languages and
              frameworks. After years of research and development, we created
              RUX – a platform that makes application development accessible,
              efficient, and enjoyable.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Today, RUX is trusted by thousands of developers, entrepreneurs,
              and businesses worldwide to build everything from simple
              prototypes to complex enterprise applications. We&apos;re just
              getting started, and we&apos;re excited to continue pushing the
              boundaries of what&apos;s possible with AI-powered development.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Built by Developers, for Developers
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-center max-w-3xl mx-auto">
            Our team combines decades of experience in software engineering,
            artificial intelligence, product design, and developer tools.
            We&apos;re passionate about creating tools that empower developers
            and make coding more accessible to everyone.
          </p>
        </div>

        {/* Join Us CTA */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-center">
          <Rocket className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the Future of Development
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Be part of a growing community of developers and creators building
            the next generation of applications with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-violet-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
