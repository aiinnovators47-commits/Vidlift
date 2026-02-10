import { getServerSession } from "next-auth/next"
import { authOptions } from "../[...nextauth]/route"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get access token from session
    const accessToken = (session as any).accessToken

    if (!accessToken) {
      // If no access token, return the current email as fallback
      return NextResponse.json({
        emails: [
          {
            email: session.user.email,
            verified: true,
            primary: true,
          }
        ]
      })
    }

    try {
      // Fetch emails from Google People API
      const response = await fetch(
        "https://www.googleapis.com/people/v1/people/me?personFields=emailAddresses",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.error("Google API error:", response.statusText)
        // Fallback to session email
        return NextResponse.json({
          emails: [
            {
              email: session.user.email,
              verified: true,
              primary: true,
            }
          ]
        })
      }

      const data = await response.json()
      const emailAddresses = data.emailAddresses || []

      const emails = emailAddresses
        .filter((e: any) => e.value)
        .map((e: any) => ({
          email: e.value,
          verified: e.metadata?.verified || false,
          primary: e.metadata?.primary || false,
        }))

      // Ensure we have at least the session email
      if (emails.length === 0) {
        emails.push({
          email: session.user.email,
          verified: true,
          primary: true,
        })
      }

      return NextResponse.json({ emails })
    } catch (err) {
      console.error("Error fetching Google emails:", err)
      // Fallback to session email
      return NextResponse.json({
        emails: [
          {
            email: session.user.email,
            verified: true,
            primary: true,
          }
        ]
      })
    }
  } catch (error) {
    console.error("Error in google-emails route:", error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
}
