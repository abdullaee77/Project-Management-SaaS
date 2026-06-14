import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "./db"
import { v4 as uuidv4 } from "uuid"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        // Find user in database
        const result = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [credentials.email]
        )

        const user = result.rows[0]

        if (!user) {
          throw new Error("No account found with this email")
        }

        if (!user.password) {
          throw new Error("Please login with Google")
        }

        // Check password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          throw new Error("Incorrect password")
        }

        if (!user.is_verified) {
          throw new Error("Please verify your email first")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          // Check if user already exists
          const existing = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [user.email]
          )

          if (existing.rows.length === 0) {
            // Create new user from Google
            const id = uuidv4()
            await db.query(
              `INSERT INTO users (id, name, email, avatar, is_verified)
               VALUES ($1, $2, $3, $4, $5)`,
              [id, user.name, user.email, user.image, true]
            )
          }
        } catch (error) {
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        // Get user from database to get our own id
        const result = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [token.email]
        )
        const dbUser = result.rows[0]
        if (dbUser) {
          token.id = dbUser.id
          token.name = dbUser.name
          token.image = dbUser.avatar
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.image = token.image as string
      }
      return session
    },
  },
})