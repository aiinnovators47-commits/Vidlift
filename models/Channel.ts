// Mongoose was removed in favor of Supabase. Keep a minimal channel type here
// to satisfy TypeScript imports until channel logic is migrated to Supabase.

export interface IChannel {
  user?: string
  channelId: string
  title: string
  description?: string
  thumbnail?: string
  subscriberCount?: number
  videoCount?: number
  viewCount?: number
  isPrimary?: boolean
  accessTokenStored?: boolean
  connectedAt?: string | Date
}

// Placeholder for previous Mongoose model; replace code to use Supabase instead.
const Channel: any = null
export default Channel
