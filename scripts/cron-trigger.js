// Simple cron job to trigger email scheduler every hour
const cron = require('node-cron');

console.log('🚀 Starting email scheduler cron job (hourly)...');

// Run every hour (0 * * * *) instead of every minute
cron.schedule('0 * * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Triggering email scheduler...`);
    
    const response = await fetch('http://localhost:3000/api/trigger-email-scheduler', {
      method: 'POST'
    });
    
    const result = await response.json();
    console.log('Scheduler result:', result);
    
  } catch (error) {
    console.error('Error triggering scheduler:', error);
  }
});

console.log('✅ Cron job started - will run every hour (on the hour)');
console.log('Press Ctrl+C to stop');

// Keep process alive
process.stdin.resume();