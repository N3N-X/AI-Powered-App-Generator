import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      {/* Navbar */}
      <nav className="backdrop-blur-xl bg-black/20 border-b border-white/10 px-6 py-4 fixed top-0 w-full z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              rux.sh
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 text-gray-300 hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-200 hover:scale-105 font-semibold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-12 hover:border-white/20 transition-all duration-500 hover:shadow-cyan-500/10 relative overflow-hidden">
            {/* Card Background Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-2xl"></div>

            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 rounded-full mb-6 border border-white/10">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 text-sm font-medium">AI-Powered App Builder</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent leading-tight">
                Build Desktop Apps from Plain English
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Describe any app idea, get complete Rust + Tauri source code
                instantly. Preview, customize, and download executables for Windows,
                Mac, Linux, iOS, and Android.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105"
                >
                  Get Started Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-8 py-4 rounded-full border border-white/20 text-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 text-center">
              <div className="text-5xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-4">Describe Your App</h3>
              <p className="text-gray-300">
                Tell us your app idea in plain English. Choose your target
                platform from Windows, Mac, Linux, iOS, or Android.
              </p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 text-center">
              <div className="text-5xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-4">Get Code & Preview</h3>
              <p className="text-gray-300">
                Receive complete Rust + Tauri source code instantly. Preview the
                app's look and functionality in your browser.
              </p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 text-center">
              <div className="text-5xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-4">Download & Run</h3>
              <p className="text-gray-300">
                Download ready-to-use executables or source code. Save your
                creations to your profile for easy access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">
                AI-Powered Generation
              </h3>
              <p className="text-gray-300">
                Advanced AI turns ideas into code.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Multi-Platform</h3>
              <p className="text-gray-300">Build for all major platforms.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👀</div>
              <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
              <p className="text-gray-300">See your app before downloading.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-xl font-semibold mb-2">Instant Download</h3>
              <p className="text-gray-300">Get executables or source code.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Choose Your Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <p className="text-4xl font-bold mb-4">$0</p>
              <p className="text-gray-300 mb-6">5 generations per month</p>
              <ul className="text-left mb-8 space-y-2">
                <li>• Basic app generation</li>
                <li>• Source code download</li>
                <li>• Community support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-gray-600 rounded-full text-white hover:bg-gray-500 transition-colors"
              >
                Get Started
              </Link>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-center border-2 border-cyan-400">
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <p className="text-4xl font-bold mb-4">$9.99/mo</p>
              <p className="text-gray-300 mb-6">50 generations per month</p>
              <ul className="text-left mb-8 space-y-2">
                <li>• Advanced AI features</li>
                <li>• Executable downloads</li>
                <li>• Priority support</li>
                <li>• Custom previews</li>
              </ul>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white hover:shadow-lg transition-all"
              >
                Upgrade Now
              </Link>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Admin</h3>
              <p className="text-4xl font-bold mb-4">$29.99/mo</p>
              <p className="text-gray-300 mb-6">Unlimited generations</p>
              <ul className="text-left mb-8 space-y-2">
                <li>• Everything in Pro</li>
                <li>• Custom integrations</li>
                <li>• White-label options</li>
                <li>• 24/7 support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-gray-600 rounded-full text-white hover:bg-gray-500 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 rux.sh. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
