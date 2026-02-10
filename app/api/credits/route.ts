import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createClient } from "@supabase/supabase-js"
import { INITIAL_CREDITS } from "@/models/Credit"

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// GET: Get user credits
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email
    const supabase = getSupabaseClient()

    // Check if user credits exist
    const { data: existingCredit, error: fetchError } = await supabase
      .from("credits")
      .select("*")
      .eq("user_email", userEmail)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching credits:", fetchError)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
    }

    // If user doesn't have credits, create initial credits
    if (!existingCredit) {
      const { data: newCredit, error: insertError } = await supabase
        .from("credits")
        .insert({
          user_email: userEmail,
          credits: INITIAL_CREDITS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating credits:", insertError)
        return NextResponse.json({ error: "Failed to create credits" }, { status: 500 })
      }

      return NextResponse.json({
        credits: INITIAL_CREDITS,
        isNew: true,
      })
    }

    return NextResponse.json({
      credits: existingCredit.credits,
      isNew: false,
    })
  } catch (error: any) {
    console.error("Credits GET error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Deduct credits
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, feature } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const userEmail = session.user.email
    const supabase = getSupabaseClient()

    // Get current credits
    const { data: currentCredit, error: fetchError } = await supabase
      .from("credits")
      .select("*")
      .eq("user_email", userEmail)
      .single()

    if (fetchError) {
      console.error("Error fetching credits:", fetchError)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
    }

    // Check if user has enough credits
    if (!currentCredit || currentCredit.credits < amount) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          insufficient: true,
          required: amount,
          available: currentCredit?.credits || 0,
        },
        { status: 402 }
      )
    }

    // Deduct credits
    const newCredits = currentCredit.credits - amount
    const { data: updatedCredit, error: updateError } = await supabase
      .from("credits")
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", userEmail)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating credits:", updateError)
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
    }

    // Log the credit transaction (optional)
    await supabase.from("credit_transactions").insert({
      user_email: userEmail,
      amount: -amount,
      feature: feature || "unknown",
      balance_after: newCredits,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      credits: newCredits,
      deducted: amount,
      feature,
    })
  } catch (error: any) {
    console.error("Credits POST error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}