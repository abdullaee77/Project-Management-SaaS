import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canCreateProject } from "@/lib/workspace"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params
    const body = await req.json()

    const taskResult = await db.query(`SELECT * FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    const task = taskResult.rows[0]

    const myRole = await getMemberRole(task.workspace_id, session.user.id)
    if (!canCreateProject(myRole)) {
      return NextResponse.json({ error: "You don't have permission to edit this task" }, { status: 403 })
    }

    const fields: string[] = []
    const values: any[] = []
    let i = 1

    if (body.title !== undefined) { fields.push(`title = $${i++}`); values.push(body.title.trim()) }
    if (body.description !== undefined) { fields.push(`description = $${i++}`); values.push(body.description?.trim() || null) }
    if (body.status !== undefined) { fields.push(`status = $${i++}`); values.push(body.status) }
    if (body.priority !== undefined) { fields.push(`priority = $${i++}`); values.push(body.priority) }
    if (body.position !== undefined) { fields.push(`position = $${i++}`); values.push(body.position) }
    if (body.dueDate !== undefined) { fields.push(`due_date = $${i++}`); values.push(body.dueDate || null) }
    if (body.assigneeId !== undefined) { fields.push(`assignee_id = $${i++}`); values.push(body.assigneeId || null) }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    fields.push(`updated_at = NOW()`)
    values.push(taskId)

    await db.query(`UPDATE tasks SET ${fields.join(", ")} WHERE id = $${i}`, values)

    return NextResponse.json({ message: "Task updated" }, { status: 200 })

  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const taskResult = await db.query(`SELECT * FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    const task = taskResult.rows[0]

    const myRole = await getMemberRole(task.workspace_id, session.user.id)
    if (!canCreateProject(myRole)) {
      return NextResponse.json({ error: "You don't have permission to delete this task" }, { status: 403 })
    }

    await db.query(`DELETE FROM tasks WHERE id = $1`, [taskId])

    return NextResponse.json({ message: "Task deleted" }, { status: 200 })

  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}