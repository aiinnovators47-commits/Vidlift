import { getServerSession } from "next-auth/next"
import { authOptions } from "../[...nextauth]/route"
import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email: newEmail } = body

    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json(
        { error: "Invalid email", message: "Please provide a valid email address" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: "Invalid email", message: "Please provide a valid email address" },
        { status: 400 }
      )
    }

    try {
      const supabase = createServerSupabaseClient()

      // Get current user ID from session
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", session.user.email)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: "User not found", message: "Your account could not be found" },
          { status: 404 }
        )
      }

      // Check if new email already exists (and isn't the current user's old email)
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", newEmail)
        .single()

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: "Email taken", message: "This email address is already in use" },
          { status: 409 }
        )
      }

      // Update user email
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          email: newEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating user email:", updateError)
        return NextResponse.json(
          { error: "Update failed", message: "Failed to update your email address" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Email updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
        }
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Database error", message: "An error occurred while updating your email" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in update-email route:", error)
    return NextResponse.json(
      { error: "Internal server error", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
