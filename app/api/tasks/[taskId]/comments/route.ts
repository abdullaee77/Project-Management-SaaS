import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole } from "@/lib/workspace"
import { createNotification } from "@/lib/notifications"
import { v4 as uuidv4 } from "uuid"

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
      `SELECT c.id, c.content, c.created_at, u.id as user_id, u.name, u.avatar
       FROM task_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    )

    return NextResponse.json({ comments: result.rows }, { status: 200 })

  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params
    const { content } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    const taskResult = await db.query(`SELECT * FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    const task = taskResult.rows[0]

    const myRole = await getMemberRole(task.workspace_id, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const commentId = uuidv4()
    await db.query(
      `INSERT INTO task_comments (id, task_id, user_id, content)
       VALUES ($1, $2, $3, $4)`,
      [commentId, taskId, session.user.id, content.trim()]
    )

    // Notify the task's assignee and creator (but not the commenter)
    const notifyUserIds = new Set<string>()
    if (task.assignee_id && task.assignee_id !== session.user.id) notifyUserIds.add(task.assignee_id)
    if (task.created_by && task.created_by !== session.user.id) notifyUserIds.add(task.created_by)

    for (const uid of notifyUserIds) {
      await createNotification({
        userId: uid,
        workspaceId: task.workspace_id,
        title: "New comment",
        message: `${session.user.name} commented on "${task.title}"`,
        type: "task_comment",
        link: `/projects/${task.project_id}`,
      })
    }

    return NextResponse.json(
      {
        comment: {
          id: commentId,
          content: content.trim(),
          created_at: new Date().toISOString(),
          user_id: session.user.id,
          name: session.user.name,
          avatar: session.user.image,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Add comment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}