'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { monokai } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { theme } from '@/lib/theme';

interface CodeFile {
  [key: string]: string;
}

interface GeneratedApp {
  id: string;
  prompt: string;
  code: string;
  platform: string;
  created_at: string;
}

interface UsageInfo {
  role: string;
  current: number;
  limit: number;
}

const PLATFORMS = ['windows', 'mac', 'linux', 'ios', 'android'];

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("windows");
  const [code, setCode] = useState<CodeFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [changePrompt, setChangePrompt] = useState("");
  const [pastApps, setPastApps] = useState<GeneratedApp[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const router = useRouter();

  useEffect(() => {
    const fetchPast = async () => {
      setLoadingPast(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("generated_apps")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) console.error("Error fetching past apps:", error);
        else setPastApps(data || []);
      }
      setLoadingPast(false);
    };
    fetchPast();
  }, []);

  useEffect(() => {
    if (code && code["src/index.html"]) {
      const blob = new Blob([code["src/index.html"]], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("platform", platform);
    const res = await fetch("/api/generate", { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      setCode({ ...data.code, id: data.id });
      setUsage(data.usage);
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("platform", platform);
    formData.append("existing_code", JSON.stringify(code));
    formData.append("change_prompt", changePrompt);
    const res = await fetch("/api/generate", { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      setCode({ ...data.code, id: data.id || code?.id });
      setUsage(data.usage);
      setChangePrompt("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const downloadSource = () => {
    if (!code) return;
    const zip = new JSZip();
    Object.entries(code).forEach(([file, content]) => {
      if (content) zip.file(file, content);
    });
    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, `app-source-${platform}.zip`);
    });
  };

  const downloadApp = async () => {
    if (!code || building) return;
    setBuilding(true);
    try {
      const buildData = code.id ? {} : { code, platform };
      const response = await fetch(`/api/build/${code.id || 'temp'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(buildData).length > 0 ? JSON.stringify(buildData) : undefined,
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rux-${platform}-${code.id || 'temp'}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Build failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Build error:', error);
      alert('Failed to build app. Please try again.');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradients.background} text-white relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className={theme.nav.base}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
              rux.sh
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Ready to build</span>
            </div>
            <Link href="/billing" className={theme.buttons.outline}>
              Billing
            </Link>
            <Link href="/settings" className={theme.buttons.outline}>
              Settings
            </Link>
            <button onClick={handleLogout} className={theme.buttons.danger}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto p-6 space-y-12 pb-32">
        {!code ? (
          <div className={`${theme.card.base} ${theme.card.hover} p-12 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-2xl"></div>

            <div className="text-center mb-12 relative z-10">
              <div className={`inline-flex items-center space-x-2 bg-gradient-to-r ${theme.gradients.primaryLight} px-4 py-2 rounded-full mb-6 border border-white/10`}>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 text-sm font-medium">AI-Powered App Builder</span>
              </div>
              <h1 className={theme.text.h1 + " mb-6"}>Generate Your Desktop App</h1>
              <p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
                Describe your app in plain English and our AI will build a complete, functional desktop application for you
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-200 flex items-center space-x-2">
                    <span>📝</span>
                    <span>App Description</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-slate-800/60 border border-white/20 rounded-2xl p-6 text-white placeholder-gray-400 resize-none min-h-[140px] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 shadow-lg"
                    placeholder="e.g., A calculator app with basic arithmetic operations, scientific functions, memory features, and a beautiful dark theme"
                    required
                  />
                  <p className="text-xs text-gray-400">Be specific about features, design preferences, and functionality</p>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-200 flex items-center space-x-2">
                    <span>🎯</span>
                    <span>Target Platform</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-800/60 border border-white/20 rounded-2xl p-6 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 shadow-lg appearance-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p} className="bg-slate-800 text-white">
                        {p === 'mac' ? '🍎 macOS' : p === 'windows' ? '💿 Windows' : p === 'linux' ? '🐧 Linux' : p === 'ios' ? '📱 iOS' : p === 'android' ? '🤖 Android' : p}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">Choose the platform your app will run on</p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`${theme.buttons.primary} w-full max-w-md py-5 text-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? '🔄 Generating Your App...' : '🚀 Generate App ✨'}
                </button>
                <p className="text-sm text-gray-400 text-center max-w-md">
                  {platform === 'mac' && "macOS apps are built with Dioxus (Rust) for native performance"}
                  {platform === 'windows' && "Windows apps use Dioxus (Rust) with native integration"}
                  {platform === 'linux' && "Linux apps are built with Dioxus (Rust) for desktop environments"}
                  {platform === 'ios' && "iOS apps follow Apple's Human Interface Guidelines"}
                  {platform === 'android' && "Android apps use Material Design 3 components"}
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-12">
            <div className={`${theme.card.dark} rounded-3xl shadow-2xl p-10 hover:border-white/25 transition-all hover:shadow-cyan-500/10 relative overflow-hidden`}>
              <div className="absolute top-4 right-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-white font-bold text-lg animate-bounce">✓</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Code Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">📄</span>
                    </div>
                    <h2 className={theme.text.h3}>Generated Source Code</h2>
                  </div>
                  <div className="max-h-[700px] overflow-y-auto bg-slate-900/70 rounded-2xl p-6 border border-white/10 shadow-inner space-y-4">
                    {Object.entries(code).map(([file, content]) => (
                      <div key={file} className="border-b border-white/5 pb-4 last:border-b-0">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded flex items-center justify-center text-xs font-mono">
                            {file.split('.').pop()?.toUpperCase()}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-200">{file}</h3>
                        </div>
                        {content && (
                          <SyntaxHighlighter
                            language={file.endsWith('.rs') ? 'rust' : file.endsWith('.js') ? 'javascript' : file.endsWith('.json') ? 'json' : 'html'}
                            style={monokai}
                            className="rounded-xl text-sm !bg-slate-800/50 !m-0"
                          >
                            {content}
                          </SyntaxHighlighter>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">👀</span>
                    </div>
                    <h2 className={theme.text.h3}>Live Preview</h2>
                    <div className="ml-auto px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl p-6 border border-white/10 shadow-2xl">
                    {previewUrl ? (
                      <div className="relative">
                        <iframe
                          src={previewUrl}
                          className="w-full h-[600px] bg-white rounded-xl border-0 shadow-2xl"
                          title="App Preview"
                        />
                        <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                          Interactive Preview
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-[600px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/20 flex items-center justify-center shadow-2xl">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <span className="text-4xl">📱</span>
                          </div>
                          <p className="text-gray-400 text-lg font-medium">Preview not available</p>
                          <p className="text-gray-500 text-sm mt-2">HTML preview coming soon</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Below both sections */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={downloadSource}
                    className={`${theme.buttons.success} w-full py-3 text-sm flex items-center justify-center space-x-2`}
                  >
                    <span>📁</span>
                    <span>Download Source</span>
                  </button>
                  <button
                    onClick={downloadApp}
                    disabled={building || platform === 'ios' || platform === 'android'}
                    className={`${theme.buttons.success} w-full py-3 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span>{building ? '⏳' : '🚀'}</span>
                    <span>{building ? 'Building...' : 'Download Build'}</span>
                  </button>
                  <button
                    onClick={() => setCode(null)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-gray-500/50 transition-all hover:scale-105 text-sm flex items-center justify-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>New App</span>
                  </button>
                  <Link
                    href="/billing"
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all hover:scale-105 text-sm flex items-center justify-center space-x-2"
                  >
                    <span>⚡</span>
                    <span>Upgrade</span>
                  </Link>
                </div>
              </div>

              {/* Enhance Section */}
              <div className="mt-12 pt-12 border-t border-white/10">
                <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 rounded-2xl p-8 border border-white/10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">✨</span>
                    </div>
                    <h3 className="text-2xl font-bold text-purple-300">Enhance Your App</h3>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      value={changePrompt}
                      onChange={(e) => setChangePrompt(e.target.value)}
                      className="w-full bg-slate-800/60 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 resize-none min-h-[120px] focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 shadow-lg"
                      placeholder="e.g., Add a dark theme toggle, improve the layout with larger buttons, add features..."
                    />
                    <button
                      onClick={handleUpdate}
                      disabled={loading || !changePrompt.trim()}
                      className={`${theme.buttons.secondary} w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? '✨ Enhancing Your App...' : '✨ Apply Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Footer */}
        {usage && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6 shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full shadow-lg bg-gradient-to-r ${theme.plans[usage.role as 'free' | 'pro' | 'ultimate'].color}`}></div>
                  <div>
                    <span className="text-white font-bold text-lg">
                      {usage.role.charAt(0).toUpperCase() + usage.role.slice(1)} Plan
                    </span>
                    <div className="text-gray-400 text-sm">
                      Used: <span className="font-semibold text-white">{usage.current}</span> / {usage.limit} this month
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((usage.current / (typeof usage.limit === 'string' && usage.limit === 'unlimited' ? usage.current + 1 : typeof usage.limit === 'number' ? usage.limit : 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {typeof usage.limit === 'string' && usage.limit === 'unlimited' ? '∞' : typeof usage.limit === 'number' ? Math.max(0, usage.limit - usage.current) : 'N/A'} remaining
                  </span>
                </div>
              </div>
              {usage.role === "free" && (
                <Link href="/billing" className={`${theme.buttons.warning} flex items-center space-x-2`}>
                  <span>⚡</span>
                  <span>Upgrade to PRO</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Past Creations */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 px-6 py-3 rounded-full mb-6 border border-white/10`}>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">Your App Library</span>
            </div>
            <h2 className={theme.text.h2}>Your Past Creations</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-4">
              {loadingPast ? "Loading..." : pastApps.length === 0 ? "No apps generated yet. Let's create your first one! 🚀" : `You've built ${pastApps.length} app${pastApps.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {loadingPast ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your apps...</p>
              </div>
            </div>
          ) : pastApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastApps.map((app) => (
                <div key={app.id} className={`${theme.card.base} ${theme.card.hover} p-8 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-xl group-hover:from-cyan-400/20 group-hover:to-blue-600/20 transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                        <span className="text-sm font-medium text-gray-300">{app.platform}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(app.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-200 mb-6 line-clamp-3 text-sm">{app.prompt}</p>
                    <button
                      onClick={() => {
                        setCode(JSON.parse(app.code));
                        setPlatform(app.platform);
                      }}
                      className={`${theme.buttons.success} w-full py-3 text-sm flex items-center justify-center space-x-2`}
                    >
                      <span>🔄</span>
                      <span>Load This App</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Ready to Create?</h3>
              <p className="text-gray-500">Your first app is just a description away!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
