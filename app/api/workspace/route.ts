import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// ============================================
// POST — Create a new workspace
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Step 1 — Check user is logged in
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Step 2 — Get workspace name from request
    const { name } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    // Step 3 — Generate a unique slug from the name
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    let slug = baseSlug
    let counter = 1

    // Keep checking until we find a slug that doesn't exist
    while (true) {
      const existing = await db.query(
        "SELECT id FROM workspaces WHERE slug = $1",
        [slug]
      )
      if (existing.rows.length === 0) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Step 4 — Create the workspace
    const workspaceId = uuidv4()
    await db.query(
      `INSERT INTO workspaces (id, name, slug, owner_id, plan)
       VALUES ($1, $2, $3, $4, $5)`,
      [workspaceId, name.trim(), slug, userId, "free"]
    )

    // Step 5 — Add the creator as Owner in workspace_members
    const memberId = uuidv4()
    await db.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role)
       VALUES ($1, $2, $3, $4)`,
      [memberId, workspaceId, userId, "owner"]
    )

    // Step 6 — Create a free subscription record
    const subscriptionId = uuidv4()
    await db.query(
      `INSERT INTO subscriptions (id, workspace_id, plan, status)
       VALUES ($1, $2, $3, $4)`,
      [subscriptionId, workspaceId, "free", "active"]
    )

    return NextResponse.json(
      {
        message: "Workspace created successfully",
        workspace: {
          id: workspaceId,
          name: name.trim(),
          slug,
          plan: "free",
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Create workspace error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

// ============================================
// GET — Get all workspaces for logged in user
// ============================================
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get all workspaces this user is a member of, with their role
    const result = await db.query(
      `SELECT 
        w.id, 
        w.name, 
        w.slug, 
        w.logo, 
        w.plan,
        wm.role,
        w.created_at
       FROM workspaces w
       INNER JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1
       ORDER BY w.created_at ASC`,
      [userId]
    )

    return NextResponse.json(
      { workspaces: result.rows },
      { status: 200 }
    )

  } catch (error) {
    console.error("Get workspaces error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}