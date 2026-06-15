'use client'

import { useState, useEffect } from "react"
import { formatRelativeTime } from "@/lib/format"
interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  name: string
  avatar: string | null
}

export default function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false))
  }, [taskId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...prev, data.comment])
        setText("")
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {c.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}