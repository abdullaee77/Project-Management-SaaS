'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAccept = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      router.push(`/workspace/${data.workspaceId}`)
      router.refresh()

    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? "Joining..." : "Accept invitation"}
      </button>
    </div>
  )
}