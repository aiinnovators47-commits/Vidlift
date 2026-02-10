"use client"

export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using YouTubeAI Pro ("Service"), you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, you are 
              prohibited from using or accessing this site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              YouTubeAI Pro provides AI-powered tools and analytics for YouTube content creators. The service 
              includes channel comparison, content analysis, and growth recommendations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You agree to use the service only for lawful purposes</li>
              <li>You must not violate any laws in your jurisdiction</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. YouTube Integration</h2>
            <p className="text-gray-700 mb-4">
              Our service integrates with YouTube APIs to provide analytics and insights. By using our service, 
              you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Comply with YouTube's Terms of Service</li>
              <li>Only connect channels you own or have explicit permission to manage</li>
              <li>Not misuse YouTube's APIs or attempt to circumvent rate limits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content, features, and functionality of the Service are owned by YouTubeAI Pro and are 
              protected by international copyright, trademark, patent, trade secret, and other intellectual 
              property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              YouTubeAI Pro shall not be liable for any direct, indirect, incidental, special, consequential, 
              or exemplary damages resulting from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material 
              changes by posting the new Terms of Service on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Information</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:support@youtubeaipro.com" className="text-blue-600 hover:underline">
                support@youtubeaipro.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}