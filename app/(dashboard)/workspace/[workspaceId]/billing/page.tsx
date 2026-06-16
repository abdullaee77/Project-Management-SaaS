import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import BillingClient from "@/components/workspace/BillingClient"
export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Only owner can see billing
  const wsResult = await db.query(
    `SELECT w.id, w.name, w.plan, w.owner_id,
       s.stripe_subscription_id, s.status as sub_status,
       s.current_period_end
     FROM workspaces w
     LEFT JOIN subscriptions s ON s.workspace_id = w.id
     WHERE w.id = $1 AND w.owner_id = $2`,
    [workspaceId, session.user.id]
  )

  if (wsResult.rows.length === 0) {
    notFound()
  }

  const workspace = wsResult.rows[0]

  return (
    <BillingClient workspace={workspace} />
  )
}