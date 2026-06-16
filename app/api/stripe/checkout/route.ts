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

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    // Step 1 — Get workspace + current subscription
    const wsResult = await db.query(
      `SELECT w.*, s.stripe_customer_id, s.plan
       FROM workspaces w
       LEFT JOIN subscriptions s ON s.workspace_id = w.id
       WHERE w.id = $1 AND w.owner_id = $2`,
      [workspaceId, session.user.id]
    )

    if (wsResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found or you are not the owner" },
        { status: 404 }
      )
    }

    const workspace = wsResult.rows[0]

    if (workspace.plan === "pro") {
      return NextResponse.json(
        { error: "This workspace is already on the Pro plan" },
        { status: 400 }
      )
    }

    // Step 2 — Get or create Stripe customer
    let customerId = workspace.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: {
          workspaceId,
          userId: session.user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to DB
      await db.query(
        `UPDATE subscriptions SET stripe_customer_id = $1 WHERE workspace_id = $2`,
        [customerId, workspaceId]
      )
    }

    // Step 3 — Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/billing`,
      metadata: {
        workspaceId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })

  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}