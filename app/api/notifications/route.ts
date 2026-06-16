import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// ============================================
// GET — List notifications + unread count
// ============================================
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await db.query(
      `SELECT id, title, message, type, is_read, link, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [session.user.id]
    )

    const unreadResult = await db.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [session.user.id]
    )

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: Number(unreadResult.rows[0].count),
    })

  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// PATCH — Mark one or all notifications as read
// ============================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, markAll } = await req.json()

    if (markAll) {
      await db.query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1`,
        [session.user.id]
      )
    } else if (id) {
      await db.query(
        `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
        [id, session.user.id]
      )
    } else {
      return NextResponse.json({ error: "id or markAll is required" }, { status: 400 })
    }

    return NextResponse.json({ message: "Updated" })

  } catch (error) {
    console.error("Update notifications error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}