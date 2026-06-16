import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await req.json()

    const result = await db.query(
      `SELECT s.stripe_customer_id FROM subscriptions s
       INNER JOIN workspaces w ON w.id = s.workspace_id
       WHERE s.workspace_id = $1 AND w.owner_id = $2`,
      [workspaceId, session.user.id]
    )

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      return NextResponse.json({ error: "No billing found" }, { status: 404 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: result.rows[0].stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/billing`,
    })

    return NextResponse.json({ url: portalSession.url })

  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}