import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Initialize Razorpay only if credentials are available
let razorpay: Razorpay | null = null

function initializeRazorpay() {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  }
  return razorpay
}

const plans = {
  starter: {
    name: 'Pro Pack',
    amount: 49900, // ₹499 in paise
    duration: '1 month',
    credits: 180
  },
  pro: {
    name: 'Business Pack',
    amount: 69900, // ₹699 in paise
    duration: '3 months',
    credits: 500
  }
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Razorpay
    const razorpayInstance = initializeRazorpay()
    
    if (!razorpayInstance) {
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planId } = await req.json()

    if (!planId || !plans[planId as keyof typeof plans]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    const plan = plans[planId as keyof typeof plans]

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        email: session.user.email,
        planId: planId,
        planName: plan.name
      }
    })

    // Store order in database
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_email: session.user.email,
        razorpay_order_id: order.id,
        plan_id: planId,
        amount: plan.amount,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing order:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderId: order.id,
      amount: plan.amount,
      currency: 'INR',
      planName: plan.name,
      razorpayKey: process.env.RAZORPAY_KEY_ID
    })
  } catch (error: any) {
    console.error('Payment order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    )
  }
}