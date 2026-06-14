import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    // Step 1 — Get token and new password
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Step 2 — Find user with valid token
    const result = await db.query(
      `SELECT * FROM users 
       WHERE reset_token = $1 
       AND reset_token_expiry > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Step 3 — Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Step 4 — Update password and clear token
    await db.query(
      `UPDATE users 
       SET password = $1,
           reset_token = NULL,
           reset_token_expiry = NULL,
           updated_at = NOW()
       WHERE reset_token = $2`,
      [hashedPassword, token]
    )

    return NextResponse.json(
      { message: "Password reset successfully. You can now login." },
      { status: 200 }
    )

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}