import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as any
        const workspaceId = session.metadata?.workspaceId
        const subscriptionId = session.subscription

        if (workspaceId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          const item = subscription.items?.data[0]

          await db.query(
            `UPDATE subscriptions
             SET stripe_subscription_id = $1,
                 plan = 'pro',
                 status = 'active',
                 current_period_start = to_timestamp($2),
                 current_period_end = to_timestamp($3),
                 updated_at = NOW()
             WHERE workspace_id = $4`,
            [
              subscriptionId,
              item?.current_period_start ?? null,
              item?.current_period_end ?? null,
              workspaceId,
            ]
          )

          await db.query(
            `UPDATE workspaces SET plan = 'pro', updated_at = NOW() WHERE id = $1`,
            [workspaceId]
          )
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          const workspaceId = subscription.metadata?.workspaceId
          const item = subscription.items?.data[0]

          if (workspaceId) {
            await db.query(
              `UPDATE subscriptions
               SET status = 'active',
                   current_period_start = to_timestamp($1),
                   current_period_end = to_timestamp($2),
                   updated_at = NOW()
               WHERE workspace_id = $3`,
              [
                item?.current_period_start ?? null,
                item?.current_period_end ?? null,
                workspaceId,
              ]
            )
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any
        const workspaceId = subscription.metadata?.workspaceId

        if (workspaceId) {
          await db.query(
            `UPDATE subscriptions
             SET plan = 'free',
                 status = 'cancelled',
                 stripe_subscription_id = NULL,
                 updated_at = NOW()
             WHERE workspace_id = $1`,
            [workspaceId]
          )

          await db.query(
            `UPDATE workspaces SET plan = 'free', updated_at = NOW() WHERE id = $1`,
            [workspaceId]
          )
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any
        const workspaceId = subscription.metadata?.workspaceId
        const item = subscription.items?.data[0]

        if (workspaceId) {
          await db.query(
            `UPDATE subscriptions
             SET status = $1,
                 current_period_start = to_timestamp($2),
                 current_period_end = to_timestamp($3),
                 updated_at = NOW()
             WHERE workspace_id = $4`,
            [
              subscription.status,
              item?.current_period_start ?? null,
              item?.current_period_end ?? null,
              workspaceId,
            ]
          )
        }
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}