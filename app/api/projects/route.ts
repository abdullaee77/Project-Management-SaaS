import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canCreateProject } from "@/lib/workspace"
import { v4 as uuidv4 } from "uuid"

// ============================================
// POST — Create a new project
// ============================================
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, name, description, color } = await req.json()

    if (!workspaceId || !name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Workspace and project name are required" },
        { status: 400 }
      )
    }

    // Permission check — viewers can't create projects
    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!canCreateProject(myRole)) {
      return NextResponse.json(
        { error: "You don't have permission to create projects" },
        { status: 403 }
      )
    }

    const projectId = uuidv4()
    await db.query(
      `INSERT INTO projects (id, workspace_id, name, description, color, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'active', $6)`,
      [projectId, workspaceId, name.trim(), description?.trim() || null, color || "#6366f1", session.user.id]
    )

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: {
          id: projectId,
          workspace_id: workspaceId,
          name: name.trim(),
          description: description?.trim() || null,
          color: color || "#6366f1",
          status: "active",
          task_count: 0,
          completed_count: 0,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

// ============================================
// GET — List projects in a workspace
// ============================================
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = req.nextUrl.searchParams.get("workspaceId")
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const result = await db.query(
      `SELECT p.*, 
         COUNT(t.id) as task_count,
         COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_count
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.workspace_id = $1 AND p.status != 'archived'
       GROUP BY p.id
       ORDER BY p.created_at ASC`,
      [workspaceId]
    )

    return NextResponse.json({ projects: result.rows }, { status: 200 })

  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}