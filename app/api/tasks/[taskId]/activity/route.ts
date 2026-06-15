import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole } from "@/lib/workspace"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const taskResult = await db.query(`SELECT workspace_id FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const myRole = await getMemberRole(taskResult.rows[0].workspace_id, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const result = await db.query(
      `SELECT a.id, a.action, a.old_value, a.new_value, a.created_at, u.name
       FROM task_activity a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [taskId]
    )

    return NextResponse.json({ activity: result.rows }, { status: 200 })

  } catch (error) {
    console.error("Get activity error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}