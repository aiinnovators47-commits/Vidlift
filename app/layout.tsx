import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import AuthProvider from "./providers"
import InstantLoading from '@/components/instant-loading'
import "./globals.css"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Vidiomex - AI-Powered YouTube Growth & Video Tools",
  description:
    "Automate your YouTube workflow with AI-powered tools. Smart scheduling, content creation, analytics, and growth tools designed for creators.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans overflow-x-hidden`}>
        <AuthProvider>
          <Suspense fallback={null}>
            <InstantLoading />
          </Suspense>
          <Suspense fallback={<MinimalLoader />}>{children}</Suspense>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}

function MinimalLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}
