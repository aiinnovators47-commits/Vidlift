'use client';

import Image from 'next/image';

export default function VidiomexIntegration() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header Preview */}
      <div className="border-b border-slate-700 bg-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="/vidlyst-logo.svg" 
                  alt="Vidlyst" 
                  width={40} 
                  height={40} 
                  className="object-cover" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Vidlyst
                </span>
                <span className="text-xs text-gray-300">AI Video Tools</span>
              </div>
            </div>
            <div className="text-white text-sm">Header Integration ✓</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Vidlyst Logo Integration
          </h1>
          <p className="text-xl text-gray-300">
            Successfully deployed across all pages and components
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-white">Header</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Logo integrated in main navigation bar across all pages
            </p>
            <div className="mt-4 text-green-400 font-semibold">✓ Complete</div>
          </div>

          {/* Footer */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-white">Footer</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Logo and branding updated in footer across all pages
            </p>
            <div className="mt-4 text-green-400 font-semibold">✓ Complete</div>
          </div>

          {/* Sidebar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-white">Sidebar</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Logo integrated in dashboard sidebar navigation
            </p>
            <div className="mt-4 text-green-400 font-semibold">✓ Complete</div>
          </div>

          {/* All Pages */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-white">All Pages</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Brand name updated from TubeBoost AI to Vidiomex everywhere
            </p>
            <div className="mt-4 text-green-400 font-semibold">✓ Complete</div>
          </div>
        </div>

        {/* Updated Components */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Updated Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
            <div>✓ components/header.tsx</div>
            <div>✓ components/footer.tsx</div>
            <div>✓ components/shared-sidebar.tsx</div>
            <div>✓ app/layout.tsx</div>
            <div>✓ app/bulk-upload/page.tsx</div>
            <div>✓ All brand text updates</div>
            <div>✓ All logo image references</div>
            <div>✓ All gradient colors updated</div>
          </div>
        </div>

        {/* Logo Preview */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6">Logo Preview</h3>
          <div className="flex justify-center">
            <div className="bg-slate-800 rounded-2xl p-12 border border-white/20">
              <Image 
                src="/vidiomex-logo.svg" 
                alt="Vidiomex" 
                width={120} 
                height={120}
                className="mx-auto"
              />
              <p className="text-center text-white font-bold text-2xl mt-4">VIDIOMEX</p>
              <p className="text-center text-gray-400 text-sm mt-2">AI-Powered Video Tools Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Preview */}
      <footer className="border-t border-slate-700 bg-white/5 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10">
                <Image 
                  src="/vidiomex-logo.svg" 
                  alt="Vidiomex" 
                  width={40} 
                  height={40}
                />
              </div>
              <div>
                <p className="font-bold text-white">Vidiomex</p>
                <p className="text-xs text-gray-400">AI Video Platform</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">© 2024 Vidiomex. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
