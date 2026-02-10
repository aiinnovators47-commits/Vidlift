import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

const planCredits = {
  starter: 180,
  pro: 500
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId
    } = await req.json()

    // Verify Razorpay signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const digest = shasum.digest('hex')

    if (digest !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Get plan credits
    const credits = planCredits[planId as keyof typeof planCredits] || 180

    // Update payment status in database
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpay_payment_id,
        completed_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)

    if (updatePaymentError) {
      console.error('Error updating payment:', updatePaymentError)
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      )
    }

    // Update user credits
    const { data: existingCredit } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_email', session.user.email)
      .single()

    if (existingCredit) {
      const { error: updateCreditError } = await supabase
        .from('credits')
        .update({
          credits: existingCredit.credits + credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_email', session.user.email)

      if (updateCreditError) {
        console.error('Error updating credits:', updateCreditError)
        return NextResponse.json(
          { error: 'Failed to update credits' },
          { status: 500 }
        )
      }
    } else {
      // Create new credit entry if doesn't exist
      const { error: insertCreditError } = await supabase
        .from('credits')
        .insert({
          user_email: session.user.email,
          credits: credits,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertCreditError) {
        console.error('Error creating credits:', insertCreditError)
        return NextResponse.json(
          { error: 'Failed to create credits' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits added',
      creditsAdded: credits
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
