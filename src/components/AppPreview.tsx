// src/components/AppPreview.tsx
'use client';

interface AppPreviewProps {
  code: Record<string, string>;
}

export function AppPreview({ code }: AppPreviewProps) {
  // Try to extract HTML content or create a preview
  const htmlFile = code['src/index.html'];
  const readmeFile = code['README.md'];
  const mainFile = code['src/main.rs'] || code['src/lib.rs'];

  if (htmlFile) {
    return (
      <iframe
        srcDoc={htmlFile}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="App Preview"
      />
    );
  }

  // Fallback: Show summary for Dioxus/Rust apps
  return (
    <div className="w-full h-full overflow-auto bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Project Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated Dioxus Application</h2>
          <p className="text-gray-700">
            This is a Rust/Dioxus desktop application. Download the source or executable to run it locally.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Start</h3>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-gray-700"># Extract and navigate to the folder</p>
            <p className="text-blue-600 font-medium">unzip rux-app.zip && cd rux-app</p>
            <p className="text-gray-700 mt-3"># Build the application</p>
            <p className="text-blue-600 font-medium">cargo build --release</p>
            <p className="text-gray-700 mt-3"># Run it</p>
            <p className="text-blue-600 font-medium">./target/release/rux-app</p>
          </div>
        </div>

        {/* Project Structure */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Structure</h3>
          <div className="font-mono text-sm space-y-1 text-gray-700">
            <p>rux-app/</p>
            <p className="ml-4">├── Cargo.toml              <span className="text-gray-500"># Project manifest</span></p>
            <p className="ml-4">├── src/</p>
            <p className="ml-8">├── main.rs                 <span className="text-gray-500"># Entry point</span></p>
            <p className="ml-8">├── lib.rs                  <span className="text-gray-500"># Main app component</span></p>
            <p className="ml-8">└── components/</p>
            <p className="ml-12">├── common.rs             <span className="text-gray-500"># Reusable components</span></p>
            <p className="ml-12">└── pages.rs              <span className="text-gray-500"># Page components</span></p>
            <p className="ml-4">├── README.md</p>
            <p className="ml-4">└── .gitignore</p>
          </div>
        </div>

        {/* README */}
        {readmeFile && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">README</h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap break-words font-mono text-xs">
              {readmeFile}
            </div>
          </div>
        )}

        {/* Requirements */}
        <div className="bg-yellow-50 rounded-lg p-6 mt-6 border border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span><strong>Rust 1.70+</strong> - Install from <code className="bg-white px-2 py-1 rounded">https://rustup.rs</code></span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span><strong>Cargo</strong> - Comes with Rust installation</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span><strong>Platform-specific dependencies:</strong></span>
            </li>
            <li className="ml-6">
              <strong>Windows:</strong> Visual C++ Runtime (usually pre-installed)
            </li>
            <li className="ml-6">
              <strong>macOS:</strong> Xcode Command Line Tools
            </li>
            <li className="ml-6">
              <strong>Linux:</strong> GTK 3.0+ development libraries
            </li>
          </ul>
        </div>

        {/* Tips */}
        <div className="bg-green-50 rounded-lg p-6 mt-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Helpful Commands</h3>
          <div className="space-y-2 font-mono text-sm text-gray-700">
            <p><span className="text-green-600">cargo check</span> - Check for compilation errors</p>
            <p><span className="text-green-600">cargo clippy</span> - Get code improvement suggestions</p>
            <p><span className="text-green-600">cargo run</span> - Build and run in debug mode</p>
            <p><span className="text-green-600">RUST_LOG=debug cargo run</span> - Run with debug logging</p>
            <p><span className="text-green-600">cargo build --release --target x86_64-apple-darwin</span> - Cross-compile for macOS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
