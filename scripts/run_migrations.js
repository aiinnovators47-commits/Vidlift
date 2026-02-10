#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function run() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('\nERROR: DATABASE_URL environment variable is required to run migrations.')
    console.error('Example: DATABASE_URL="postgres://user:pass@host:5432/db" npm run migrate:run\n')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    const migrationsDir = path.join(process.cwd(), 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    console.log(`Found ${files.length} migration(s):\n  ${files.join('\n  ')}`)

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`\n=== Applying ${file} ===`)
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('COMMIT')
        console.log(`✅ ${file} applied`)
      } catch (e) {
        await client.query('ROLLBACK')
        console.error(`❌ Failed to apply ${file}:`, e.message || e)
        process.exit(1)
      }
    }

    console.log('\nAll migrations applied successfully.')
  } finally {
    await client.end()
  }
}

run().catch((e) => {
  console.error('Migration runner error:', e)
  process.exit(1)
})
