import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canCreateProject } from "@/lib/workspace"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, title, description, status, priority, dueDate, assigneeId } = await req.json()

    if (!projectId || !title || title.trim().length === 0) {
      return NextResponse.json({ error: "Project and task title are required" }, { status: 400 })
    }

    // Find which workspace this project belongs to
    const projectResult = await db.query(`SELECT workspace_id FROM projects WHERE id = $1`, [projectId])
    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    const workspaceId = projectResult.rows[0].workspace_id

    // Permission check
    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!canCreateProject(myRole)) {
      return NextResponse.json({ error: "You don't have permission to create tasks" }, { status: 403 })
    }

    const taskStatus = status || "todo"

    // Find next position in this column
    const posResult = await db.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position 
       FROM tasks WHERE project_id = $1 AND status = $2`,
      [projectId, taskStatus]
    )
    const position = posResult.rows[0].next_position

    const taskId = uuidv4()
    await db.query(
      `INSERT INTO tasks 
        (id, project_id, workspace_id, title, description, status, priority, position, due_date, assignee_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        taskId, projectId, workspaceId, title.trim(),
        description?.trim() || null, taskStatus, priority || "medium",
        position, dueDate || null, assigneeId || null, session.user.id
      ]
    )

    // Log this in activity
    await db.query(
      `INSERT INTO task_activity (id, task_id, user_id, action, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), taskId, session.user.id, "created task", null, title.trim()]
    )

    return NextResponse.json(
      {
        message: "Task created",
        task: {
          id: taskId,
          title: title.trim(),
          status: taskStatus,
          priority: priority || "medium",
          position,
          due_date: dueDate || null,
          assignee_id: assigneeId || null,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}