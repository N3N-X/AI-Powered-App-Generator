// src/components/AppGenerator.tsx
'use client';

import { useState } from 'react';
import { CodePreview } from './CodePreview';
import { UserInfoBar } from './UserInfoBar';
import { AppPreview } from './AppPreview';

interface GeneratedApp {
  id: string;
  code: Record<string, string>;
  build_type: string;
  usage: {
    current: number;
    limit: number | string;
    role: string;
  };
}

export function AppGenerator() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('windows');
  const [buildType, setBuildType] = useState('source');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'preview'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('platform', platform);
      formData.append('build_type', buildType);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedApp(data);
      setSelectedFile(Object.keys(data.code)[0] || null);
      setActiveTab('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: 'source' | 'executable') => {
    if (!generatedApp) return;

    try {
      const response = await fetch(`/api/build/${generatedApp.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: generatedApp.code,
          platform,
          build_type: type,
        }),
      });

      if (!response.ok) throw new Error('Build failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rux-${platform}-${type}-${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Enhanced Navbar */}
      <UserInfoBar usage={generatedApp?.usage} />

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Generator Form */}
          <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Generate App</h1>

            <form onSubmit={handleGenerate} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your app... (e.g., 'A to-do list with task management')"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="windows">Windows</option>
                    <option value="macos">macOS</option>
                    <option value="linux">Linux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Build Type
                  </label>
                  <select
                    value={buildType}
                    onChange={(e) => setBuildType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="source">Source Code</option>
                    <option value="executable">Executable</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Generated App Display */}
          {generatedApp && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Download Buttons */}
              <div className="bg-white border-b border-gray-200 p-4 flex gap-2 justify-end">
                <button
                  onClick={() => handleDownload('source')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Download Source
                </button>
                <button
                  onClick={() => handleDownload('executable')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Download {platform === 'windows' ? 'EXE' : 'Executable'}
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-white border-b border-gray-200 flex">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-6 py-3 font-medium border-b-2 transition ${activeTab === 'preview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`px-6 py-3 font-medium border-b-2 transition ${activeTab === 'files'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Files ({Object.keys(generatedApp.code).length})
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden flex">
                {activeTab === 'preview' ? (
                  <AppPreview code={generatedApp.code} />
                ) : (
                  <div className="flex-1 flex overflow-hidden">
                    {/* File List */}
                    <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50">
                      {Object.keys(generatedApp.code).map((file) => (
                        <button
                          key={file}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left px-4 py-3 text-sm border-b border-gray-200 hover:bg-gray-100 transition ${selectedFile === file ? 'bg-blue-50 text-blue-600 font-medium' : ''
                            }`}
                        >
                          <span className="truncate block">{file}</span>
                        </button>
                      ))}
                    </div>

                    {/* Code View */}
                    {selectedFile && (
                      <CodePreview
                        filename={selectedFile}
                        content={generatedApp.code[selectedFile]}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
