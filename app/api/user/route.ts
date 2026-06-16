import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

// ============================================
// GET — Get current user profile
// ============================================
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await db.query(
      `SELECT id, name, email, avatar, is_verified, created_at FROM users WHERE id = $1`,
      [session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: result.rows[0] })

  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// PATCH — Update name or password
// ============================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, currentPassword, newPassword } = body

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      }
      await db.query(
        `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
        [name.trim(), session.user.id]
      )
    }

    // Change password
    if (currentPassword !== undefined && newPassword !== undefined) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        )
      }

      const userResult = await db.query(
        `SELECT password FROM users WHERE id = $1`,
        [session.user.id]
      )
      const user = userResult.rows[0]

      if (!user.password) {
        return NextResponse.json(
          { error: "You signed up with Google. Password change is not available." },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }

      const hashed = await bcrypt.hash(newPassword, 12)
      await db.query(
        `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
        [hashed, session.user.id]
      )
    }

    return NextResponse.json({ message: "Profile updated successfully" })

  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// DELETE — Delete account permanently
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Deleting the user cascades to all their data
    // because we used ON DELETE CASCADE on all foreign keys
    await db.query(`DELETE FROM users WHERE id = $1`, [session.user.id])

    return NextResponse.json({ message: "Account deleted" })

  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}