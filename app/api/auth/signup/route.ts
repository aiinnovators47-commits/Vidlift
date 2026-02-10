import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if user already exists in Supabase users table
    const { data: existingUser, error: fetchErr } = await supabase
      .from('users')
      .select('id,email')
      .eq('email', email.toLowerCase())
      .limit(1)
      .single()

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error('Error checking existing user:', fetchErr)
      return NextResponse.json({ error: "Failed to check existing user" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Upsert into Supabase users table
    const payload = {
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      provider: 'credentials',
      email_verified: null,
    }

    const { data, error: upsertErr } = await supabase
      .from('users')
      .insert(payload)
      .select('id,email,name')
      .single()

    if (upsertErr) {
      console.error('Upsert error:', upsertErr)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
