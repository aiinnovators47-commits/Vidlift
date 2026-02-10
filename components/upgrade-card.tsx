"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface UpgradeCardProps {
  requiredCredits?: number
  feature?: string
}

export default function UpgradeCard({ requiredCredits = 10, feature = "this feature" }: UpgradeCardProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Insufficient Credits
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          You need <span className="font-bold text-orange-600">{requiredCredits} credits</span> to use {feature}.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 text-center">
            <span className="font-semibold text-orange-700">💡 Upgrade to Premium</span> to get unlimited credits and unlock all features!
          </p>
        </div>

        {/* Benefits List */}
        <div className="mb-6 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">Unlimited credits for all features</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">Priority support & early access</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">Advanced analytics & insights</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/pricing')}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            ✨ Upgrade to Premium
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full border-2 border-gray-300 hover:bg-gray-50 font-medium py-6 rounded-lg"
          >
            Go Back
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          No credit card required • Cancel anytime
        </p>
      </div>
    </div>
  )
}
