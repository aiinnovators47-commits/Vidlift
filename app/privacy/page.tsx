"use client"

export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
            <p className="text-gray-700 mb-4">
              When you register for our service, we collect information such as your name, email address, and 
              Google account information.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">YouTube Data</h3>
            <p className="text-gray-700 mb-4">
              When you connect your YouTube channel, we collect public information about your channel including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Channel name and description</li>
              <li>Subscriber count and video statistics</li>
              <li>Public video metadata</li>
              <li>Channel creation date</li>
            </ul>
            <p className="text-gray-700">
              We do not collect private information such as email addresses of subscribers or private videos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To analyze YouTube channel performance</li>
              <li>To generate insights and recommendations</li>
              <li>To improve our service based on user feedback</li>
              <li>To communicate with you about updates and features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your data. Your information is stored on 
              secure servers with encryption and access controls.
            </p>
            <p className="text-gray-700">
              However, no method of transmission over the Internet or electronic storage is 100% secure, and 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to others. We may share generic aggregated 
              demographic information not linked to any personal identification information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You can disconnect your YouTube channel at any time</li>
              <li>You can request deletion of your account and associated data</li>
              <li>You can opt out of non-essential communications</li>
              <li>You can access and update your personal information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to track activity on our service and store 
              certain information. You can instruct your browser to refuse all cookies or to indicate when 
              a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our service does not address anyone under the age of 13. We do not knowingly collect personal 
              identifiable information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@youtubeaipro.com" className="text-blue-600 hover:underline">
                privacy@youtubeaipro.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}