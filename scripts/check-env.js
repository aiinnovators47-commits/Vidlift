const fs = require('fs');
const path = require('path');

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

console.log('🔍 Checking environment variables...\n');

let missing = [];

// Check .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=`)) {
      console.log(`⚠️  ${varName} is defined but might be empty`);
    } else if (!envContent.includes(varName)) {
      missing.push(varName);
      console.log(`❌ ${varName} is missing`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  });
} else {
  console.log('❌ .env.local file not found');
  missing = [...requiredVars];
}

console.log('\n--- Summary ---');
if (missing.length > 0) {
  console.log(`Missing ${missing.length} required environment variables:`);
  missing.forEach(v => console.log(`  - ${v}`));
  console.log('\nPlease add these to your .env.local file and Netlify environment variables');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are present');
  process.exit(0);
}