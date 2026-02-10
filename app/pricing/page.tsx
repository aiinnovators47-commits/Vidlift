"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import SharedSidebar from "@/components/shared-sidebar"
import { Button } from "@/components/ui/button"
import { Sparkles, Crown, Rocket, Check, ArrowLeft, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      description: "Try our platform for free to test it in work",
      price: "Free",
      icon: Sparkles,
      theme: "light",
      features: [
        { label: "Title Analysis", value: "3", icon: Check },
        { label: "Channel Analysis", value: "3", icon: Check },
        { label: "Compare", value: "2", icon: Check },
        { label: "Tag Suggestions", value: "5", icon: Check },
        { label: "AI Title & Description", value: "Limited", icon: Check },
        { label: "Challenge", value: "Under 1 Year", icon: Check }
      ]
    },
    {
      id: "starter",
      name: "Pro Pack",
      description: "Get a powerful pack for growing creators",
      price: "₹499",
      icon: Crown,
      theme: "dark",
      features: [
        { label: "Title Analysis", value: "10/day", icon: Check },
        { label: "Channel Analysis", value: "10/day", icon: Check },
        { label: "Compare", value: "10/day", icon: Check },
        { label: "Tag Suggestions", value: "Unlimited", icon: Check },
        { label: "AI Title & Description", value: "20/day", icon: Check },
        { label: "Challenge", value: "Under 1 Year", icon: Check },
        { label: "Priority Support", value: "Yes", icon: Check }
      ]
    },
    {
      id: "pro",
      name: "Business Pack",
      description: "Get ultimate features for professionals",
      price: "₹699",
      icon: Rocket,
      theme: "dark",
      features: [
        { label: "Title Analysis", value: "20/day", icon: Check },
        { label: "Channel Analysis", value: "20/day", icon: Check },
        { label: "Compare", value: "20/day", icon: Check },
        { label: "Tag Suggestions", value: "Unlimited", icon: Check },
        { label: "AI Title & Description", value: "Unlimited", icon: Check },
        { label: "Challenge", value: "Under 3 Years", icon: Check },
        { label: "24/7 Support", value: "Yes", icon: Check }
      ]
    }
  ]

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (planId === 'free') {
      alert('Free plan - no payment required')
      return
    }

    setLoadingPlanId(planId)
    setError(null)

    try {
      // Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        const options = {
          key: orderData.razorpayKey,
          amount: orderData.amount,
          currency: 'INR',
          name: 'YouTube AI Tools',
          description: `Purchase ${orderData.planName}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: planId
                })
              })

              if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json()
                throw new Error(errorData.error || 'Payment verification failed')
              }

              alert('Payment successful! Credits added to your account.')
              router.push('/dashboard')
            } catch (err: any) {
              setError(err.message || 'Payment verification failed')
            } finally {
              setLoadingPlanId(null)
            }
          },
          prefill: {
            email: session.user?.email,
            name: session.user?.name
          },
          notes: {
            planId: planId
          },
          theme: {
            color: '#3b82f6'
          },
          method: {
            phonepe: true,
            upi: true
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
      setLoadingPlanId(null)
    }
  }

      return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <SharedSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activePage="pricing"
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Back to Dashboard Button */}
          <div className="max-w-5xl mx-auto px-4 pt-8 md:pt-12">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-8 ml-12 md:ml-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium"></span>
            </button>
          </div>

          <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-5xl w-full grid md:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const IconComponent = plan.icon
                const isDark = plan.theme === 'dark'
                
                return (
                  <div 
                    key={plan.id}
                    className={`rounded-3xl p-6 shadow-lg ${
                      isDark 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    {/* Icon */}
                    <div className="mb-3">
                      <IconComponent className={`w-7 h-7 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                    </div>

                    {/* Plan Name */}
                    <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>

                    {/* Description */}
                    <p className={`text-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {plan.price}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => {
                        const FeatureIcon = feature.icon
                        return (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FeatureIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                              <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {feature.label}
                              </span>
                            </div>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {feature.value}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingPlanId !== null}
                      className="w-full rounded-full py-5 text-sm font-medium transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingPlanId === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.id === 'free' ? 'Download' : 'Purchase'
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
