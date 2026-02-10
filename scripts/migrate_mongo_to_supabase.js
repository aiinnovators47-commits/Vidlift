/*
  Usage: 
    - Ensure env vars are set: MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    - Run: node scripts/migrate_mongo_to_supabase.js

  What it does:
    - Copies users from Mongo `users` collection -> Supabase `users` (upsert by email)
    - Copies channels from Mongo `channels` collection -> Supabase `channels`, preserving mapping to new user ids

  NOTE: This script assumes collection names `users` and `channels`. Adjust if your Mongo collection names differ.
*/

const { MongoClient } = require('mongodb')
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const MONGO_URI = process.env.MONGO_URI
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!MONGO_URI) {
    console.error('MONGO_URI is not set. Provide it as an env var to migrate data.')
    process.exit(1)
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to insert into Supabase')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const mongo = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

  try {
    await mongo.connect()
    const db = mongo.db()

    const users = await db.collection('users').find({}).toArray()
    console.log(`Found ${users.length} users in Mongo`)

    const userMap = new Map() // mongo _id -> supabase id

    for (const u of users) {
      const payload = {
        name: u.name || null,
        email: u.email,
        password: u.password || null,
        image: u.image || null,
        provider: u.provider || null,
        email_verified: u.emailVerified || null
      }

      const { data, error } = await supabase.from('users').upsert(payload, { onConflict: 'email' }).select('id,email').limit(1)
      if (error) {
        console.error('Failed to upsert user', u.email, error)
        continue
      }
      const supId = Array.isArray(data) && data[0] ? data[0].id : null
      userMap.set(String(u._id), supId)
    }

    console.log(`Upserted ${userMap.size} users into Supabase`)

    const channels = await db.collection('channels').find({}).toArray()
    console.log(`Found ${channels.length} channels in Mongo`)

    let migrated = 0
    for (const ch of channels) {
      const mongoUserId = String(ch.user || ch.userId || ch.user_id)
      const supUserId = userMap.get(mongoUserId)
      if (!supUserId) {
        console.warn('Skipping channel because user mapping not found for', mongoUserId)
        continue
      }

      const subscriberCount = ch.subscriberCount ? Number(String(ch.subscriberCount).replace(/[^0-9]/g, '')) || null : null
      const videoCount = ch.videoCount ? Number(String(ch.videoCount).replace(/[^0-9]/g, '')) || null : null
      const viewCount = ch.viewCount ? Number(String(ch.viewCount).replace(/[^0-9]/g, '')) || null : null

      const payload = {
        user_id: supUserId,
        channel_id: ch.channelId || ch.channel_id,
        title: ch.title,
        description: ch.description || null,
        thumbnail: ch.thumbnail || null,
        subscriber_count: subscriberCount,
        video_count: videoCount,
        view_count: viewCount,
        is_primary: ch.isPrimary || ch.is_primary || false,
        access_token_stored: ch.accessTokenStored || ch.access_token_stored || false,
        connected_at: ch.connectedAt || ch.connected_at || null
      }

      const { data, error } = await supabase.from('channels').upsert(payload, { onConflict: 'user_id,channel_id' }).select('id').limit(1)
      if (error) {
        console.error('Failed to upsert channel', payload.channel_id, error.message || error)
        continue
      }
      migrated++
    }

    console.log(`Migrated ${migrated} channels to Supabase`)

    console.log('Migration complete.')
  } catch (err) {
    console.error('Migration failed', err)
    process.exit(1)
  } finally {
    await mongo.close()
  }
}

if (require.main === module) {
  main()
}
