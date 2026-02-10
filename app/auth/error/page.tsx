"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function AuthErrorContent() {
  const params = useSearchParams()
  const error = params.get('error') || 'Unknown'
  const router = useRouter()
  const [config, setConfig] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // fetch diagnostic config to show redirect URI and host info
    fetch('/api/test-config').then(r => r.json()).then(d => setConfig(d.config)).catch(() => setConfig(null))
  }, [])

  const copyRedirect = async () => {
    try {
      const redirectUri = config?.redirectUri || `${window.location.origin}/api/auth/callback/google`
      await navigator.clipboard.writeText(redirectUri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      alert('Copy failed; please copy manually: ' + (config?.redirectUri || `${window.location.origin}/api/auth/callback/google`))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-xl text-center">
        <h1 className="text-2xl font-semibold mb-4">Authentication Error</h1>
        <p className="mb-4">Error: <strong>{error}</strong></p>
        <p className="text-sm text-gray-300 mb-6">This may be caused by incorrect OAuth configuration. Check your Google OAuth redirect URIs and ensure <code>NEXTAUTH_URL</code> matches your deployment domain.</p>

        {config ? (
          <div className="mb-4 text-left">
            <div className="text-xs text-gray-400 mb-2">Detected config</div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm">NEXTAUTH_URL: <span className="font-medium">{config.NEXTAUTH_URL}</span></div>
              <div className="text-sm">NEXTAUTH_HOST: <span className="font-medium">{config.NEXTAUTH_HOST || '—'}</span></div>
              <div className="text-sm">YouTube Redirect: <span className="font-medium">{config.redirectUri}</span></div>
              <div className="text-sm">Google OAuth Callback: <span className="font-medium">{config.googleAuthCallback}</span></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => {
                try {
                  navigator.clipboard.writeText(config.googleAuthCallback)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2500)
                } catch (e) {
                  alert('Copy failed; please copy manually: ' + config.googleAuthCallback)
                }
              }} className="px-3 py-2 bg-blue-600 rounded">{copied ? 'Copied!' : 'Copy Google Callback'}</button>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">Open Google Console</a>
            </div>
          </div>
        ) : (
          <div className="mb-4 text-sm text-gray-400">Unable to load config. Ensure environment variables are set.</div>
        )}

        <div className="flex justify-center gap-3">
          <button onClick={() => router.push('/api/test-config')} className="px-4 py-2 bg-blue-600 rounded">View config</button>
          <button onClick={() => router.push('/signup')} className="px-4 py-2 border rounded">Back to Sign In</button>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}