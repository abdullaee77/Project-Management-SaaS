import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { sendVerificationEmail } from "@/lib/utils"

import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    // Step 1 — Get data from request body
    const { name, email, password } = await req.json()

    // Step 2 — Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Step 3 — Check if email already exists
    const existing = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
    }

    // Step 4 — Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Step 5 — Generate verification token
    const verifyToken = uuidv4()
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Step 6 — Create user in database
    const id = uuidv4()
    await db.query(
      `INSERT INTO users 
        (id, name, email, password, is_verified, verify_token, verify_token_expiry)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, email, hashedPassword, false, verifyToken, verifyTokenExpiry]
    )

    await sendVerificationEmail(email, name, verifyToken)


    return NextResponse.json(
      { message: "Account created successfully. Please verify your email." },
      { status: 201 }
    )

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}