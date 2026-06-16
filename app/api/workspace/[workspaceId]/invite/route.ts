import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canManageWorkspace } from "@/lib/workspace"
import { sendInviteEmail } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

// ============================================
// POST — Send an invitation
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    const { email, role } = await req.json()

    // Step 1 — Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      )
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Step 2 — Check permission
    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!canManageWorkspace(myRole)) {
      return NextResponse.json(
        { error: "You don't have permission to invite members" },
        { status: 403 }
      )
    }

    // Step 3 — Check if already a member
    const existingMember = await db.query(
      `SELECT wm.id FROM workspace_members wm
       INNER JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1 AND u.email = $2`,
      [workspaceId, email]
    )

    if (existingMember.rows.length > 0) {
      return NextResponse.json(
        { error: "This user is already a member" },
        { status: 400 }
      )
    }

    // Step 4 — Check for existing pending invite
    const existingInvite = await db.query(
      `SELECT id FROM invitations 
       WHERE workspace_id = $1 AND email = $2 AND status = 'pending'`,
      [workspaceId, email]
    )

    if (existingInvite.rows.length > 0) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      )
    }

    // Step 5 — Get workspace name for the email
    const workspaceResult = await db.query(
      "SELECT name FROM workspaces WHERE id = $1",
      [workspaceId]
    )
    const workspaceName = workspaceResult.rows[0]?.name

    // Step 6 — Create invitation
    const invitationId = uuidv4()
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.query(
      `INSERT INTO invitations (id, workspace_id, invited_by, email, role, token, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
      [invitationId, workspaceId, session.user.id, email, role, token, expiresAt]
    )
console.log("DEBUG workspaceName:", workspaceName)
    // Step 7 — Send email
    await sendInviteEmail(email, workspaceName, token, role)

    return NextResponse.json(
      { message: "Invitation sent successfully" },
      { status: 201 }
    )

  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

// ============================================
// GET — List pending invitations
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params

    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const result = await db.query(
      `SELECT id, email, role, status, created_at, expires_at
       FROM invitations
       WHERE workspace_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [workspaceId]
    )

    return NextResponse.json({ invitations: result.rows }, { status: 200 })

  } catch (error) {
    console.error("Get invitations error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}