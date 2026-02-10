"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'

export default function EmailDiagnosticsPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('')

  const testEmailSystem = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmail || undefined })
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        error: error.message,
        success: false
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Email System Diagnostics</h1>
          </div>

          <p className="text-gray-600 mb-6">
            Test if your email system is properly configured for challenge notifications.
          </p>

          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address (optional)
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Leave blank to use your account email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              A test email will be sent to verify your configuration
            </p>
          </div>

          {/* Test Button */}
          <Button
            onClick={testEmailSystem}
            disabled={testing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Test Email System
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="space-y-4">
                {/* Success/Error Status */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    result.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                      {result.success ? '✅ Email System Working!' : '❌ Email System Error'}
                    </h3>
                    <p className={`text-sm mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.message || result.error}
                    </p>
                  </div>
                </div>

                {/* Diagnostics */}
                {result.diagnostics && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Configuration Status:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">SMTP Email:</span>
                        <code className={result.diagnostics.smtpEmail ? 'text-green-600' : 'text-red-600'}>
                          {result.diagnostics.smtpEmail}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SMTP Password:</span>
                        <code className={result.diagnostics.smtpPassword ? 'text-green-600' : 'text-red-600'}>
                          {result.diagnostics.smtpPassword}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SMTP Configured:</span>
                        <code className={result.diagnostics.smtpConfigured ? 'text-green-600' : 'text-red-600'}>
                          {result.diagnostics.smtpConfigured ? '✅ YES' : '❌ NO'}
                        </code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Test Results */}
                {result.connectionTest && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">SMTP Connection Test:</h4>
                    <div className="flex items-center gap-2">
                      {result.connectionTest.success ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700">Connection successful ✅</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700">Connection failed</span>
                        </>
                      )}
                    </div>
                    {result.connectionTest.error && (
                      <p className="text-sm text-red-600 mt-2">{result.connectionTest.error}</p>
                    )}
                  </div>
                )}

                {/* Send Test Results */}
                {result.sendResult && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Email Send Test:</h4>
                    <div className="flex items-center gap-2">
                      {result.sendResult.success ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700">
                            Email sent successfully to {result.diagnostics.testingEmail}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700">Failed to send email</span>
                        </>
                      )}
                    </div>
                    {result.sendResult.error && (
                      <p className="text-sm text-red-600 mt-2">{result.sendResult.error}</p>
                    )}
                  </div>
                )}

                {/* Troubleshooting Steps */}
                {!result.success && result.solutions && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">How to Fix:</h4>
                    <ol className="space-y-2 text-sm text-yellow-800">
                      {result.solutions.map((step: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-semibold flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Troubleshooting Steps */}
                {!result.success && result.troubleshooting && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">Troubleshooting:</h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      {result.troubleshooting.map((tip: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documentation Link */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    📖 For detailed setup instructions, see{' '}
                    <a
                      href="/docs/EMAIL_TROUBLESHOOTING_GUIDE.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:text-blue-900"
                    >
                      Email Troubleshooting Guide
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
