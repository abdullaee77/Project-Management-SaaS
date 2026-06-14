import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// ============================================
// GET — Check if an invitation is valid
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const result = await db.query(
      `SELECT i.*, w.name as workspace_name
       FROM invitations i
       INNER JOIN workspaces w ON w.id = i.workspace_id
       WHERE i.token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "This invitation link is invalid" }, { status: 404 })
    }

    const invite = result.rows[0]

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 })
    }

    return NextResponse.json({
      workspaceName: invite.workspace_name,
      email: invite.email,
      role: invite.role,
    })

  } catch (error) {
    console.error("Get invite error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// POST — Accept the invitation
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    // Step 1 — Find the invitation
    const result = await db.query(
      `SELECT * FROM invitations WHERE token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "This invitation link is invalid" }, { status: 404 })
    }

    const invite = result.rows[0]

    // Step 2 — Validate status and expiry
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 })
    }

    // Step 3 — Email must match the logged in user
    if (session.user.email !== invite.email) {
      return NextResponse.json(
        { error: `This invitation was sent to ${invite.email}. Please sign in with that email.` },
        { status: 403 }
      )
    }

    // Step 4 — Check not already a member (edge case)
    const existing = await db.query(
      `SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [invite.workspace_id, session.user.id]
    )

    if (existing.rows.length === 0) {
      const memberId = uuidv4()
      await db.query(
        `INSERT INTO workspace_members (id, workspace_id, user_id, role)
         VALUES ($1, $2, $3, $4)`,
        [memberId, invite.workspace_id, session.user.id, invite.role]
      )
    }

    // Step 5 — Mark invitation as accepted
    await db.query(
      `UPDATE invitations SET status = 'accepted' WHERE id = $1`,
      [invite.id]
    )

    return NextResponse.json({
      message: "You've joined the workspace",
      workspaceId: invite.workspace_id,
    })

  } catch (error) {
    console.error("Accept invite error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}