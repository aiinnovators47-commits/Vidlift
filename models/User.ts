// Mongoose was removed in favor of Supabase. Keep a minimal user type here
// to satisfy TypeScript imports until auth is migrated to Supabase.

export interface IUser {
  id?: string
  name?: string
  email: string
  password?: string
  image?: string
  provider?: string
  emailVerified?: Date
  createdAt?: Date
  updatedAt?: Date
}

// Placeholder for previous Mongoose model; replace with Supabase client usage.
const User: any = null
export default User
