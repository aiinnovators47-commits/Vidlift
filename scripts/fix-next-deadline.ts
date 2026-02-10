/**
 * Script to fix next_upload_deadline for existing challenges
 * Run this once to populate the next_upload_deadline field for challenges that don't have it set
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface Challenge {
  id: string
  started_at: string
  cadence_every_days: number
  progress: any[]
  next_upload_deadline: string | null
}

function calculateNextDeadline(startDate: string, frequencyDays: number, uploadsCompleted: number): Date {
  const start = new Date(startDate)
  const nextUpload = new Date(start)
  // Calculate the next upload day based on how many uploads have been completed
  const daysToAdd = (uploadsCompleted + 1) * frequencyDays
  nextUpload.setDate(start.getDate() + daysToAdd)
  return nextUpload
}

async function fixNextDeadlines() {
  try {
    console.log('🔍 Fetching active challenges without next_upload_deadline...')
    
    // Get all active challenges
    const { data: challenges, error } = await supabase
      .from('user_challenges')
      .select('id, started_at, cadence_every_days, progress, next_upload_deadline, challenge_uploads(id, upload_date)')
      .eq('status', 'active')
    
    if (error) {
      console.error('❌ Error fetching challenges:', error)
      return
    }

    if (!challenges || challenges.length === 0) {
      console.log('✅ No active challenges found')
      return
    }

    console.log(`📊 Found ${challenges.length} active challenge(s)`)

    for (const challenge of challenges) {
      try {
        // Skip if next_upload_deadline is already set and in the future
        if (challenge.next_upload_deadline) {
          const deadline = new Date(challenge.next_upload_deadline)
          if (deadline > new Date()) {
            console.log(`⏭️  Challenge ${challenge.id} already has valid deadline: ${deadline.toISOString()}`)
            continue
          }
        }

        // Count completed uploads
        const uploadsCount = (challenge as any).challenge_uploads?.length || 0
        
        // Get frequency (default to 1 day if not set)
        const frequency = challenge.cadence_every_days || 1
        
        // Calculate next deadline
        const nextDeadline = calculateNextDeadline(
          challenge.started_at,
          frequency,
          uploadsCount
        )

        console.log(`📅 Challenge ${challenge.id}:`)
        console.log(`   Started: ${challenge.started_at}`)
        console.log(`   Frequency: Every ${frequency} day(s)`)
        console.log(`   Uploads completed: ${uploadsCount}`)
        console.log(`   New deadline: ${nextDeadline.toISOString()}`)

        // Update the challenge
        const { error: updateError } = await supabase
          .from('user_challenges')
          .update({
            next_upload_deadline: nextDeadline.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', challenge.id)

        if (updateError) {
          console.error(`❌ Error updating challenge ${challenge.id}:`, updateError)
        } else {
          console.log(`✅ Successfully updated challenge ${challenge.id}`)
        }
      } catch (err) {
        console.error(`❌ Error processing challenge ${challenge.id}:`, err)
      }
    }

    console.log('\n✨ Deadline fix complete!')
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the script
fixNextDeadlines()
