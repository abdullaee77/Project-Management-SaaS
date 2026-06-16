import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canCreateProject } from "@/lib/workspace"
import { logTaskActivity } from "@/lib/activity"
import { createNotification } from "@/lib/notifications"

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
}
const STATUS_LABELS: Record<string, string> = {
  todo: "To Do", in_progress: "In Progress", in_review: "In Review", done: "Done",
}

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
    const oldTask = taskResult.rows[0]

    const myRole = await getMemberRole(oldTask.workspace_id, session.user.id)
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

    // ===== Log activity for meaningful changes =====
    const userId = session.user.id

    if (body.title !== undefined && body.title.trim() !== oldTask.title) {
      await logTaskActivity(taskId, userId, "renamed task", oldTask.title, body.title.trim())
    }

    if (body.status !== undefined && body.status !== oldTask.status) {
      await logTaskActivity(
        taskId, userId, "moved task",
        STATUS_LABELS[oldTask.status] || oldTask.status,
        STATUS_LABELS[body.status] || body.status
      )
    }

    if (body.priority !== undefined && body.priority !== oldTask.priority) {
      await logTaskActivity(
        taskId, userId, "changed priority",
        PRIORITY_LABELS[oldTask.priority] || oldTask.priority,
        PRIORITY_LABELS[body.priority] || body.priority
      )
    }

    if (body.dueDate !== undefined) {
      const oldDate = oldTask.due_date ? new Date(oldTask.due_date).toLocaleDateString() : null
      const newDate = body.dueDate ? new Date(body.dueDate).toLocaleDateString() : null
      if (oldDate !== newDate) {
        await logTaskActivity(taskId, userId, "changed due date", oldDate, newDate)
      }
    }

    if (body.assigneeId !== undefined && body.assigneeId !== oldTask.assignee_id) {
      let oldName: string | null = "Unassigned"
      let newName: string | null = "Unassigned"

      if (oldTask.assignee_id) {
        const r = await db.query(`SELECT name FROM users WHERE id = $1`, [oldTask.assignee_id])
        oldName = r.rows[0]?.name || "Unassigned"
      }
      if (body.assigneeId) {
        const r = await db.query(`SELECT name FROM users WHERE id = $1`, [body.assigneeId])
        newName = r.rows[0]?.name || "Unassigned"
      }

      await logTaskActivity(taskId, userId, "changed assignee", oldName, newName)

      // Notify the newly assigned user
      if (body.assigneeId && body.assigneeId !== userId) {
        await createNotification({
          userId: body.assigneeId,
          workspaceId: oldTask.workspace_id,
          title: "New task assigned",
          message: `You were assigned to "${oldTask.title}"`,
          type: "task_assigned",
          link: `/projects/${oldTask.project_id}`,
        })
      }
    }

    if (body.description !== undefined && (body.description?.trim() || null) !== oldTask.description) {
      await logTaskActivity(taskId, userId, "updated description", null, null)
    }

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