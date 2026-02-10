/**
 * Authentication utility functions for Next.js App Router + NextAuth
 * Centralized auth logic to ensure consistent behavior across the app
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Get authenticated user on the server
 * Returns user ID and session, or null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.warn('⚠️ No session or email found. Session:', session?.user ? { email: session.user.email, name: session.user.name } : 'null')
      return null
    }

    const supabase = createServerSupabaseClient()
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.warn('⚠️ User not found in database for email:', session.user.email, 'Error:', error.message)
      return null
    }

    if (!userRow?.id) {
      console.warn('⚠️ User row returned but missing ID:', userRow)
      return null
    }

    console.log('✅ Authenticated user:', { userId: userRow.id, email: userRow.email })
    
    return {
      userId: userRow.id,
      email: userRow.email,
      name: userRow.name || session.user.name || session.user.email,
      session
    }
  } catch (error) {
    console.error('❌ Error getting authenticated user:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Create a protected API response
 * Use this in API routes to ensure proper error handling
 */
export function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}

/**
 * Create a server error response
 */
export function createErrorResponse(message: string, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}
