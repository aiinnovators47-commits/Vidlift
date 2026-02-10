#!/usr/bin/env node

/**
 * Vercel Deployment Readiness Checker
 * 
 * This script verifies that your project is ready for Vercel deployment
 * by checking all required files, configurations, and dependencies.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Deployment Readiness Checker\n');
console.log('Checking your project for Vercel deployment...\n');

let allChecksPassed = true;
const checks = [];

// Helper function to add check results
function addCheck(name, passed, message) {
  checks.push({ name, passed, message });
  if (!passed) allChecksPassed = false;
  console.log(`  ${passed ? '✅' : '❌'} ${name}: ${message}`);
}

// 1. Check required files exist
console.log('📁 File Structure Check:');
const requiredFiles = [
  'vercel.json',
  'next.config.mjs',
  'package.json',
  '.env.example',
  'VERCEL_DEPLOYMENT_GUIDE.md'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  addCheck(file, exists, exists ? 'Found' : 'MISSING');
});

// 2. Check API routes exist
console.log('\n📡 API Routes Check:');
const requiredApiRoutes = [
  'app/api/challenges/send-reminder-emails/route.ts',
  'app/api/challenges/cron/upload-reminder/route.ts',
  'app/api/challenges/cron/morning-reminder/route.ts',
  'app/api/challenges/cron/daily-check/route.ts',
  'app/api/challenges/cron/process-notifications/route.ts',
  'app/api/challenge-notifications/cron/route.ts',
  'app/api/challenge-uploads/auto-detect/route.ts',
  'app/api/trigger-hourly-emails/route.ts'
];

requiredApiRoutes.forEach(route => {
  const fullPath = path.join(__dirname, '..', route);
  const exists = fs.existsSync(fullPath);
  addCheck(route.replace('app/api/', ''), exists, exists ? 'Found' : 'MISSING');
});

// 3. Check vercel.json configuration
console.log('\n⚙️  Vercel Configuration Check:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const hasCrons = vercelConfig.crons && Array.isArray(vercelConfig.crons);
  addCheck('vercel.json crons', hasCrons, hasCrons ? `Found ${vercelConfig.crons.length} cron jobs` : 'No cron jobs configured');
  
  if (hasCrons) {
    const cronPaths = vercelConfig.crons.map(cron => cron.path);
    const expectedPaths = [
      '/api/challenges/send-reminder-emails',
      '/api/challenges/cron/upload-reminder',
      '/api/challenges/cron/morning-reminder',
      '/api/challenges/cron/daily-check',
      '/api/challenges/cron/process-notifications',
      '/api/challenge-notifications/cron',
      '/api/challenge-uploads/auto-detect'
    ];
    
    expectedPaths.forEach(expectedPath => {
      const exists = cronPaths.includes(expectedPath);
      addCheck(`Cron: ${expectedPath}`, exists, exists ? 'Configured' : 'NOT CONFIGURED');
    });
  }
} catch (error) {
  addCheck('vercel.json parsing', false, 'Invalid JSON format');
}

// 4. Check package.json dependencies
console.log('\n📦 Dependencies Check:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const requiredDeps = [
    'next',
    '@supabase/supabase-js',
    'nodemailer',
    'react',
    'react-dom'
  ];
  
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
    addCheck(`Dependency: ${dep}`, !!hasDep, hasDep ? `v${hasDep.replace('^', '')}` : 'MISSING');
  });
  
  // Check build scripts
  const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
  addCheck('Build script', !!hasBuildScript, hasBuildScript ? 'npm run build' : 'MISSING');
  
} catch (error) {
  addCheck('package.json parsing', false, 'Invalid JSON format');
}

// 5. Check for Netlify remnants
console.log('\n🧹 Cleanup Check:');
const netlifyFiles = [
  'netlify.toml',
  'scripts/netlify-build.sh',
  'netlify-setup.js'
];

netlifyFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  addCheck(`Netlify file: ${file}`, !exists, exists ? 'STILL EXISTS - Remove for clean Vercel deployment' : 'Clean');
});

// 6. Check environment variables example
console.log('\n🔐 Environment Variables Check:');
try {
  const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'CRON_SECRET',
    'SMTP_EMAIL',
    'SMTP_PASSWORD'
  ];
  
  requiredVars.forEach(envVar => {
    const exists = envExample.includes(envVar);
    addCheck(`Env var: ${envVar}`, exists, exists ? 'Documented' : 'NOT DOCUMENTED');
  });
} catch (error) {
  addCheck('.env.example reading', false, 'File not found');
}

// Final summary
console.log('\n' + '='.repeat(50));
console.log('📋 DEPLOYMENT READINESS SUMMARY');
console.log('='.repeat(50));

const passedChecks = checks.filter(check => check.passed).length;
const totalChecks = checks.length;

console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} checks`);
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks} checks`);

if (allChecksPassed) {
  console.log('\n🎉 Your project is READY for Vercel deployment!');
  console.log('\nNext steps:');
  console.log('1. Review VERCEL_DEPLOYMENT_GUIDE.md');
  console.log('2. Push code to GitHub');
  console.log('3. Connect repository to Vercel');
  console.log('4. Add environment variables in Vercel dashboard');
  console.log('5. Deploy and monitor cron jobs');
} else {
  console.log('\n⚠️  Some issues need to be fixed before deployment.');
  console.log('\nFailed checks:');
  checks.filter(check => !check.passed).forEach(check => {
    console.log(`  - ${check.name}: ${check.message}`);
  });
  console.log('\nPlease fix the above issues and run this check again.');
}

console.log('\n' + '='.repeat(50));

process.exit(allChecksPassed ? 0 : 1);