import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { createServerSupabaseClient } from "@/lib/supabase"

// Ensure this route runs in the Node runtime and is treated as dynamic to avoid
// static analysis errors during build (e.g., 'ComponentMod.patchFetch' issues).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { sendLoginNotificationEmail } from '@/lib/emailService'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request YouTube write scope along with default scopes
      scope: 'openid email profile https://www.googleapis.com/auth/youtube',
      // Force the account chooser so users can select which Google account to use
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password")
        }

        try {
          let supabase
          try {
            supabase = createServerSupabaseClient()
          } catch (err: any) {
            console.error('Supabase client init failed (authorize):', err?.message || err)
            throw new Error('Server configuration error')
          }

          // Find user by email in Supabase users table
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email.toLowerCase())
            .limit(1)
            .single()

          if (error || !user || !user.password) {
            throw new Error("Invalid email or password")
          }

          // Check password (bcrypt hash stored in users.password)
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error("Invalid email or password")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (err) {
          console.error('Credentials authorize error:', err)
          throw new Error('Invalid email or password')
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signup",
    error: "/auth/error"
  },
  events: {
    async error(message) {
      // Log NextAuth internal errors (useful for debugging provider callback failures)
      console.error('NextAuth event error:', message)
    },
    async signIn(message) {
      // Log sign in provider details for debugging (do NOT log secrets)
      try { console.log('NextAuth signIn event:', { user: (message as any).user?.email, account: (message as any).account?.provider }) } catch (e) { console.log('signIn event', e) }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      // Upsert user into Supabase users table (for Google sign-ins)
      try {
        let supabase
        try {
          supabase = createServerSupabaseClient()
        } catch (err: any) {
          console.error('Supabase client init failed (signIn callback):', err?.message || err)
          return false
        }

        const payload: any = {
          email: user.email,
          name: user.name,
          image: (user as any).image || null,
        }

        if (account?.provider === 'google') {
          payload.provider = 'google'
          payload.email_verified = new Date()
        }

        const { data, error } = await supabase
          .from('users')
          .upsert(payload, { onConflict: 'email' })
          .select('id,email')
          .limit(1)
          .single()

        if (error) {
          console.error('Error upserting user to Supabase:', error)
          // Do not block sign-in because of a DB upsert failure in production — allow OAuth sign-in
        } else {
          console.log('✅ Supabase user upserted:', data?.email)
          // Send a non-blocking login notification email for Google sign-ins
          try {
            if (account?.provider === 'google' && user?.email) {
              await sendLoginNotificationEmail({ userEmail: user.email, userName: user.name || 'Creator', provider: 'Google' })
            }
          } catch (e) {
            console.warn('⚠️ Login notification email failed (non-blocking):', e)
          }
        }
      } catch (error) {
        console.error('❌ Error in signIn callback (upsert error):', error)
        // Allow sign-in to proceed even if DB upsert fails — return true so providers don't block user login
        return true
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      // If it's a relative path, append to baseUrl
      if (url.startsWith('/')) {
        // For the initial Google OAuth callback that comes from signup page with /connect as callback,
        // redirect to email selection first, preserving the intended destination
        if (url === '/connect') {
          return `${baseUrl}/auth/email-select?callbackUrl=/connect`;
        }
        
        // For other URLs, allow them directly
        return `${baseUrl}${url}`;
      }
      
      // If it's an absolute URL but within our base URL, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to /connect for any other cases
      return `${baseUrl}/connect`;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      // Store the access token from Google
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      // Include access token in session
      (session as any).accessToken = token.accessToken
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }