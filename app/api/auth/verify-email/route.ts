import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/utils"


export async function GET(req: NextRequest) {
  try {
    // Step 1 — Get token from URL
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is missing" },
        { status: 400 }
      )
    }

    // Step 2 — Find user with this token
    const result = await db.query(
      `SELECT * FROM users 
       WHERE verify_token = $1 
       AND verify_token_expiry > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // Step 3 — Mark user as verified
    await db.query(
      `UPDATE users 
       SET is_verified = true, 
           verify_token = NULL, 
           verify_token_expiry = NULL,
           updated_at = NOW()
       WHERE verify_token = $1`,
      [token]
    )
    const user = result.rows[0]
await sendWelcomeEmail(user.email, user.name)

    return NextResponse.json(
      { message: "Email verified successfully. You can now login." },
      { status: 200 }
    )

  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}