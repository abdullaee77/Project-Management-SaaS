import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canCreateProject } from "@/lib/workspace"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tasks } = await req.json()

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "tasks array is required" }, { status: 400 })
    }

    // Check permission using the first task's workspace
    const firstTask = await db.query(`SELECT workspace_id FROM tasks WHERE id = $1`, [tasks[0].id])
    if (firstTask.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const myRole = await getMemberRole(firstTask.rows[0].workspace_id, session.user.id)
    if (!canCreateProject(myRole)) {
      return NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 })
    }

    for (const t of tasks) {
      await db.query(
        `UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3`,
        [t.status, t.position, t.id]
      )
    }

    return NextResponse.json({ message: "Reordered" }, { status: 200 })

  } catch (error) {
    console.error("Reorder error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}