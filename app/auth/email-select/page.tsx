"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react"

interface GoogleEmail {
  email: string
  verified: boolean
  primary: boolean
}

export default function EmailSelectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [emails, setEmails] = useState<GoogleEmail[]>([])
  const [selectedEmail, setSelectedEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // If no session, redirect to signin
    if (status === "unauthenticated") {
      router.push("/signup")
      return
    }

    // If session exists, get email addresses from Google
    if (status === "authenticated" && session?.user?.email) {
      fetchGoogleEmails()
    }
  }, [status, session, router])

  const fetchGoogleEmails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get emails from Google People API
      const response = await fetch("/api/auth/google-emails")
      
      if (!response.ok) {
        throw new Error("Failed to fetch email addresses")
      }

      const data = await response.json()
      
      if (data.emails && data.emails.length > 0) {
        setEmails(data.emails)
        // Pre-select primary email
        const primaryEmail = data.emails.find((e: GoogleEmail) => e.primary)
        setSelectedEmail(primaryEmail?.email || data.emails[0].email)
      } else {
        // Fallback to session email
        setEmails([{ email: session?.user?.email || "", verified: true, primary: true }])
        setSelectedEmail(session?.user?.email || "")
      }
    } catch (err) {
      console.error("Error fetching emails:", err)
      setError("Could not fetch your email addresses. Please try again.")
      // Fallback to session email
      if (session?.user?.email) {
        setEmails([{ email: session.user.email, verified: true, primary: true }])
        setSelectedEmail(session.user.email)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectEmail = (email: string) => {
    setSelectedEmail(email)
    setError(null)
  }

  const handleConfirm = async () => {
    if (!selectedEmail) {
      setError("Please select an email address")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      // Update user email in database
      const response = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update email")
      }

      setSuccessMessage("Email confirmed! Redirecting to dashboard...")
      
      // Wait 1 second then redirect to connected page
      setTimeout(() => {
        router.push("/connect")
      }, 1000)
    } catch (err) {
      console.error("Error updating email:", err)
      setError(err instanceof Error ? err.message : "Failed to update email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-200 text-lg font-medium">Loading your email addresses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Google branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Confirm Your Email</h1>
          <p className="text-slate-300 font-medium mb-1">
            Google Account: <span className="text-blue-400">{session?.user?.name}</span>
          </p>
          <p className="text-slate-400 text-sm">
            Select which email to use with your YouTube Creator Account
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Email Cards */}
        <div className="space-y-3 mb-6">
          {emails.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-400">No email addresses found</p>
            </div>
          ) : (
            emails.map((emailItem) => (
              <button
                key={emailItem.email}
                onClick={() => handleSelectEmail(emailItem.email)}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedEmail === emailItem.email
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedEmail === emailItem.email
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-600 bg-transparent group-hover:border-slate-500"
                    }`}
                  >
                    {selectedEmail === emailItem.email && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium flex items-center gap-2 flex-wrap">
                      <span className="break-all">{emailItem.email}</span>
                      {emailItem.primary && (
                        <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Primary
                        </span>
                      )}
                    </div>
                    {!emailItem.verified && (
                      <p className="text-sm text-yellow-400 mt-1">⚠️ Not verified</p>
                    )}
                    {emailItem.verified && (
                      <p className="text-xs text-green-400 mt-1">✓ Verified</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">Error</p>
              <p className="text-red-300/80 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || !selectedEmail || isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirming Email...
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Continue to Dashboard
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-xs text-center">
            💡 We'll use this email to manage your YouTube Creator account and send you notifications about challenges, uploads, and analytics.
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
          <p className="text-blue-300 text-xs">
            <strong>What happens next:</strong> After confirming your email, you'll be directed to your dashboard where you can connect your YouTube channel and start creating content.
          </p>
        </div>
      </div>
    </div>
  )
}
