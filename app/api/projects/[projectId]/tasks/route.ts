import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole } from "@/lib/workspace"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    const projectResult = await db.query(`SELECT workspace_id FROM projects WHERE id = $1`, [projectId])
    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const myRole = await getMemberRole(projectResult.rows[0].workspace_id, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const result = await db.query(
      `SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.project_id = $1
       ORDER BY t.position ASC`,
      [projectId]
    )

    return NextResponse.json({ tasks: result.rows }, { status: 200 })

  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}