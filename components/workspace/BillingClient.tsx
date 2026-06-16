'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Workspace {
  id: string
  name: string
  plan: string
  owner_id: string
  stripe_subscription_id: string | null
  sub_status: string | null
  current_period_end: string | null
}

export default function BillingClient({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleUpgrade = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      window.location.href = data.url

    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      window.location.href = data.url

    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const isPro = workspace.plan === "pro"
  const periodEnd = workspace.current_period_end
    ? new Date(workspace.current_period_end).toLocaleDateString()
    : null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 text-sm mt-1">{workspace.name}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Current plan</h2>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
            isPro ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
          }`}>
            {workspace.plan}
          </span>
        </div>

        {isPro ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              You are on the <strong>Pro plan</strong> — unlimited projects, members, and storage.
            </p>
            {periodEnd && (
              <p className="text-sm text-gray-400">
                {workspace.sub_status === "active"
                  ? `Renews on ${periodEnd}`
                  : `Access until ${periodEnd}`}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              You are on the <strong>Free plan</strong>.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>✗ Max 3 projects</p>
              <p>✗ Max 5 members</p>
            </div>
          </div>
        )}
      </div>

      {/* Plans Comparison */}
      {!isPro && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Upgrade to Pro</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Free</p>
              <p className="text-2xl font-bold text-gray-900 mb-3">$0</p>
              <div className="space-y-1 text-sm text-gray-500">
                <p>3 projects</p>
                <p>5 members</p>
                <p>Basic features</p>
              </div>
            </div>

            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
              <p className="font-semibold text-blue-900 mb-2">Pro</p>
              <p className="text-2xl font-bold text-blue-900 mb-3">$12<span className="text-sm font-normal">/mo</span></p>
              <div className="space-y-1 text-sm text-blue-700">
                <p>✓ Unlimited projects</p>
                <p>✓ Unlimited members</p>
                <p>✓ All features</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Redirecting..." : "Upgrade to Pro — $12/month"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>
      )}

      {/* Manage Billing (Pro users) */}
      {isPro && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Manage billing</h2>
          <p className="text-sm text-gray-500 mb-4">
            Update your payment method, view invoices, or cancel your subscription.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "Redirecting..." : "Open billing portal"}
          </button>
        </div>
      )}
    </div>
  )
}