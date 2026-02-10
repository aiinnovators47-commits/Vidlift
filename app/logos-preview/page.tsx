'use client';

export default function LogosPreview() {
  const logos = [
    { id: 1, name: 'Modern Geometric', description: 'Play button with gradient circle' },
    { id: 2, name: 'Video Wave', description: 'Dynamic wave design with smooth curves' },
    { id: 3, name: 'Bold Tech', description: 'Geometric shapes with orange gradient' },
    { id: 4, name: 'Minimalist Circle', description: 'Elegant circular design with V shape' },
    { id: 5, name: 'Text-Based Icon', description: 'Professional with text branding' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">VIDIOMEX Logos</h1>
          <p className="text-xl text-gray-300">Choose your favorite design</p>
        </div>

        {/* Logos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border border-slate-600"
            >
              {/* Logo Container */}
              <div className="bg-slate-900 rounded-lg p-8 mb-4 flex items-center justify-center h-48">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {logo.id === 1 && (
                    <>
                      <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#FF0000', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#8B00FF', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="95" fill="none" stroke="url(#grad1)" strokeWidth="2" />
                      <polygon points="70,70 70,130 130,100" fill="url(#grad1)" />
                      <path d="M 40 100 Q 50 85 60 100" fill="none" stroke="#8B00FF" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 140 100 Q 150 85 160 100" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                  {logo.id === 2 && (
                    <>
                      <defs>
                        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#00D4FF', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#0066FF', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <path d="M 40 100 Q 60 80 80 100 T 120 100 T 160 100" fill="none" stroke="url(#grad2)" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 40 120 Q 60 100 80 120 T 120 120 T 160 120" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                      <path d="M 40 80 Q 60 60 80 80 T 120 80 T 160 80" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                      <circle cx="100" cy="100" r="20" fill="url(#grad2)" />
                      <polygon points="95,95 95,105 108,100" fill="white" />
                    </>
                  )}
                  {logo.id === 3 && (
                    <>
                      <defs>
                        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#FF3D00', stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: '#FF6D00', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#FFB300', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <rect x="50" y="50" width="100" height="100" rx="10" fill="none" stroke="url(#grad3)" strokeWidth="3" />
                      <polygon points="100,70 130,100 100,130 70,100" fill="url(#grad3)" />
                      <polygon points="85,95 85,105 105,100" fill="white" />
                      <circle cx="55" cy="55" r="4" fill="url(#grad3)" />
                      <circle cx="145" cy="145" r="4" fill="url(#grad3)" />
                    </>
                  )}
                  {logo.id === 4 && (
                    <>
                      <defs>
                        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#6D28D9', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#2563EB', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="90" fill="none" stroke="url(#grad4)" strokeWidth="2.5" />
                      <circle cx="100" cy="100" r="70" fill="none" stroke="url(#grad4)" strokeWidth="1.5" opacity="0.5" />
                      <path d="M 80 60 L 100 90 L 120 60" fill="none" stroke="url(#grad4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      <polygon points="100,110 115,125 100,135 85,125" fill="url(#grad4)" opacity="0.8" />
                    </>
                  )}
                  {logo.id === 5 && (
                    <>
                      <defs>
                        <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#00BFA5', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#009688', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="70" r="35" fill="url(#grad5)" />
                      <polygon points="90,60 90,80 110,70" fill="white" />
                      <rect x="70" y="40" width="60" height="60" rx="4" fill="none" stroke="url(#grad5)" strokeWidth="2" />
                      <text x="100" y="140" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="url(#grad5)">VIDIOMEX</text>
                      <line x1="60" y1="155" x2="140" y2="155" stroke="url(#grad5)" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </div>

              {/* Logo Info */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">Logo {logo.id}</h3>
                <p className="text-sm text-gray-300">{logo.name}</p>
                <p className="text-xs text-gray-400 mt-1">{logo.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            All logos are SVG-based and scalable to any size
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Saved in: public/logos/vidiomex-logo-[1-5].svg
          </p>
        </div>
      </div>
    </div>
  );
}
