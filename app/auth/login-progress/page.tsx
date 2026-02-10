"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2, Mail, LogIn, ShieldCheck } from "lucide-react"

interface Step {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  status: "pending" | "loading" | "complete"
}

export default function LoginProgressPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: "Google Authentication",
      description: "Authenticating with your Google account...",
      icon: <LogIn className="w-6 h-6" />,
      status: "complete",
    },
    {
      id: 2,
      title: "Email Verification",
      description: "Selecting your email address...",
      icon: <Mail className="w-6 h-6" />,
      status: "loading",
    },
    {
      id: 3,
      title: "Account Setup",
      description: "Finalizing your account...",
      icon: <ShieldCheck className="w-6 h-6" />,
      status: "pending",
    },
  ])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup")
      return
    }

    if (status === "authenticated" && session?.user?.email) {
      // Update steps
      setSteps((prevSteps) =>
        prevSteps.map((step) => {
          if (step.id === 2) return { ...step, status: "complete" }
          if (step.id === 3) return { ...step, status: "loading" }
          return step
        })
      )

      // Redirect after 2 seconds
      const timer = setTimeout(() => {
        router.push("/connect")
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-slate-400">Setting up your creator dashboard...</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-6 top-16 w-0.5 h-8 ${
                    step.status === "complete" ? "bg-green-500" : "bg-slate-700"
                  }`}
                />
              )}

              {/* Step Card */}
              <div
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  step.status === "complete"
                    ? "border-green-500/50 bg-green-500/5"
                    : step.status === "loading"
                      ? "border-blue-500/50 bg-blue-500/5"
                      : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      step.status === "complete"
                        ? "bg-green-500/20 text-green-400"
                        : step.status === "loading"
                          ? "bg-blue-500/20 text-blue-400 animate-pulse"
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {step.status === "complete" ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : step.status === "loading" ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3
                      className={`font-semibold ${
                        step.status === "complete"
                          ? "text-green-400"
                          : step.status === "loading"
                            ? "text-blue-400"
                            : "text-slate-300"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                  </div>

                  {/* Status Badge */}
                  {step.status === "complete" && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium whitespace-nowrap mt-1">
                      Done
                    </span>
                  )}
                  {step.status === "loading" && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium whitespace-nowrap mt-1">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-2/3 transition-all duration-500" />
          </div>
          <p className="text-center text-slate-400 text-sm mt-3">
            Setting up your account... you'll be redirected shortly
          </p>
        </div>

        {/* Account Info */}
        {session?.user && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
            <p className="text-slate-400 text-xs mb-2">Logged in as</p>
            <p className="text-white font-medium break-all">{session.user.email}</p>
          </div>
        )}
      </div>
    </div>
  )
}
