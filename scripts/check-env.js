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

// Detect deployment platform
const isNetlify = process.env.NETLIFY === 'true' || process.env.DEPLOY_URL !== undefined;
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION !== undefined;

console.log(`📦 Deployment platform detected: ${isNetlify ? 'Netlify' : isVercel ? 'Vercel' : 'Local Development'}`);

let missing = [];
let warnings = [];

if (isNetlify || isVercel) {
  // In cloud deployment, check process.env directly
  console.log('☁️  Checking environment variables from deployment platform...');
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      // Check for placeholder values
      if (process.env[varName].includes('your_') || process.env[varName] === 'test') {
        warnings.push(`${varName} has placeholder value`);
        console.log(`⚠️  ${varName} has placeholder value - please update in dashboard`);
      } else {
        console.log(`✅ ${varName} is set`);
      }
    } else {
      missing.push(varName);
      console.log(`❌ ${varName} is missing`);
    }
  });
} else {
  // Local development - check .env.local file
  console.log('💻 Checking environment variables from .env.local file...');
  
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
}

console.log('\n--- Summary ---');
if (missing.length > 0) {
  console.log(`Missing ${missing.length} required environment variables:`);
  missing.forEach(v => console.log(`  - ${v}`));
  
  if (isNetlify) {
    console.log('\n🔧 Please add these environment variables in your Netlify dashboard:');
    console.log('   Site settings → Build & deploy → Environment → Environment variables');
  } else if (isVercel) {
    console.log('\n🔧 Please add these environment variables in your Vercel dashboard:');
    console.log('   Project settings → Environment Variables');
  } else {
    console.log('\nPlease add these to your .env.local file');
  }
  
  process.exit(1);
} else if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} environment variables have placeholder values:`);
  warnings.forEach(w => console.log(`  - ${w}`));
  
  if (isNetlify) {
    console.log('\n🔧 Please update these variables in your Netlify dashboard with actual values');
  } else if (isVercel) {
    console.log('\n🔧 Please update these variables in your Vercel dashboard with actual values');
  }
  
  console.log('✅ Environment check passed (with warnings)');
  process.exit(0);
} else {
  console.log('✅ All required environment variables are present');
  process.exit(0);
}