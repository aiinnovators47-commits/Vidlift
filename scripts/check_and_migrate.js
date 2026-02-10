#!/usr/bin/env node
const { exec } = require('child_process')
const { Client } = require('pg')

async function run() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('\nERROR: DATABASE_URL environment variable is required.')
    console.error('Example: DATABASE_URL="postgres://user:pass@host:5432/db" npm run migrate:ensure\n')
    process.exit(1)
  }

  console.log('Running migrations...')
  exec('node scripts/run_migrations.js', { env: process.env }, async (err, stdout, stderr) => {
    console.log(stdout)
    if (err) {
      console.error('Migration runner failed:', stderr || err.message)
      process.exit(1)
    }

    console.log('\nChecking for table `public.user_challenges`...')
    const client = new Client({ connectionString: databaseUrl })
    try {
      await client.connect()
      const res = await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_challenges') as exists;")
      const exists = res.rows[0]?.exists
      if (exists) {
        console.log('✅ Table `public.user_challenges` exists in the database.')
        const sample = await client.query('SELECT * FROM public.user_challenges LIMIT 5')
        console.log('Sample rows (up to 5):')
        console.log(JSON.stringify(sample.rows, null, 2))
      } else {
        console.log('❌ Table `public.user_challenges` was NOT found. Migrations may not have run correctly.')
      }
    } catch (e) {
      console.error('Error checking database:', e.message || e)
      process.exit(1)
    } finally {
      await client.end()
      process.exit(0)
    }
  })
}

run().catch((e) => {
  console.error('Error:', e)
  process.exit(1)
})
