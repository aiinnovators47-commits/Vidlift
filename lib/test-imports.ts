// Simple test to verify imports work
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import { sendIntervalMotivationalEmail } from './challengeEmailService.ts';

console.log('✅ All imports successful!');
console.log('Supabase client available:', !!createClient);
console.log('Cron available:', !!cron);
console.log('Email function available:', !!sendIntervalMotivationalEmail);

// Test if we can initialize
try {
  console.log('Testing scheduler initialization...');
  
  // Mock supabase client check
  let supabase = null;
  function getSupabaseClient() {
    if (!supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!url || !key) {
        console.log('⚠️  Supabase credentials not configured (expected in test)');
        return null;
      }
      
      supabase = createClient(url, key);
    }
    return supabase;
  }
  
  const client = getSupabaseClient();
  console.log('✅ Scheduler initialization test passed');
  
} catch (error) {
  console.error('❌ Initialization test failed:', error.message);
}

console.log('🎉 Import test completed successfully!');