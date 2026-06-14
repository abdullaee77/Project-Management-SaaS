import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { sendPasswordResetEmail } from "@/lib/utils"


export async function POST(req: NextRequest) {
  try {
    // Step 1 — Get email from request
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Step 2 — Check if user exists
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    // Step 3 — Always return success even if email not found
    // This prevents attackers from knowing which emails exist
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a reset link." },
        { status: 200 }
      )
    }

    const user = result.rows[0]

    // Step 4 — Generate reset token
    const resetToken = uuidv4()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Step 5 — Save token to database
    await db.query(
      `UPDATE users 
       SET reset_token = $1, 
           reset_token_expiry = $2,
           updated_at = NOW()
       WHERE email = $3`,
      [resetToken, resetTokenExpiry, email]
    )

    // Step 6 — Send reset email (will add later)
await sendPasswordResetEmail(email, user.name, resetToken)

    console.log(`Reset token for ${email}: ${resetToken}`)

    return NextResponse.json(
      { message: "If an account exists with this email, you will receive a reset link." },
      { status: 200 }
    )

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}