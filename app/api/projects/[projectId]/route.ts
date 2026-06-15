import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canManageWorkspace } from "@/lib/workspace"

// ============================================
// GET — Get a single project
// ============================================
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

    const result = await db.query(`SELECT * FROM projects WHERE id = $1`, [projectId])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = result.rows[0]
    const myRole = await getMemberRole(project.workspace_id, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ project, myRole }, { status: 200 })

  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// PATCH — Update project (name, description, color, status)
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const body = await req.json()

    const result = await db.query(`SELECT * FROM projects WHERE id = $1`, [projectId])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = result.rows[0]
    const myRole = await getMemberRole(project.workspace_id, session.user.id)
    if (!myRole || myRole === "viewer") {
      return NextResponse.json({ error: "You don't have permission to edit this project" }, { status: 403 })
    }

    // Build the update dynamically — only update fields that were sent
    const fields: string[] = []
    const values: any[] = []
    let i = 1

    if (body.name !== undefined) {
      fields.push(`name = $${i++}`)
      values.push(body.name.trim())
    }
    if (body.description !== undefined) {
      fields.push(`description = $${i++}`)
      values.push(body.description?.trim() || null)
    }
    if (body.color !== undefined) {
      fields.push(`color = $${i++}`)
      values.push(body.color)
    }
    if (body.status !== undefined) {
      fields.push(`status = $${i++}`)
      values.push(body.status)
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    fields.push(`updated_at = NOW()`)
    values.push(projectId)

    await db.query(
      `UPDATE projects SET ${fields.join(", ")} WHERE id = $${i}`,
      values
    )

    return NextResponse.json({ message: "Project updated" }, { status: 200 })

  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// DELETE — Delete project permanently
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    const result = await db.query(`SELECT * FROM projects WHERE id = $1`, [projectId])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = result.rows[0]
    const myRole = await getMemberRole(project.workspace_id, session.user.id)
    if (!canManageWorkspace(myRole)) {
      return NextResponse.json({ error: "You don't have permission to delete this project" }, { status: 403 })
    }

    await db.query(`DELETE FROM projects WHERE id = $1`, [projectId])

    return NextResponse.json({ message: "Project deleted" }, { status: 200 })

  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}