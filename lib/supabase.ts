import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL) {
  console.warn('[supabase] SUPABASE_URL not configured')
}

export function createServerSupabaseClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required on the server')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  })
}

export function createBrowserSupabaseClient(): SupabaseClient {
  if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required on the client')
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
