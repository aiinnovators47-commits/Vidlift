import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  // Redirect GET requests to the signup page (avoid using req.url during build-time)
  try {
    return NextResponse.redirect('/signup')
  } catch (err) {
    // Fallback safe response
    return NextResponse.json({ message: 'Redirect to signup' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user in Supabase
    let supabase
    try {
      supabase = createServerSupabaseClient()
    } catch (err: any) {
      console.error('Supabase client init failed:', err?.message || err)
      return NextResponse.json({ error: 'Server misconfigured. Please set SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 })
    }

    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1)
      .single()

    if (dbErr || !user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json(
      {
        message: "Sign in successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
