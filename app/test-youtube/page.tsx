"use client"

export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TestYouTubeConnection() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube API Test</h1>
          <p className="text-gray-600">Test your YouTube API credentials</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <p className="text-gray-700">
            This is a simplified YouTube API test page. For full functionality, please refer to the documentation.
          </p>
        </div>
      </div>
    </div>
  )
}
