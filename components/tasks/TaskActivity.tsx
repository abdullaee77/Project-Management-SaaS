'use client'

import { useState, useEffect } from "react"
import { formatRelativeTime } from "@/lib/format"
interface Activity {
  id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
  name: string
}

export default function TaskActivity({ taskId, refreshKey }: { taskId: string; refreshKey: number }) {
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/activity`)
      .then((res) => res.json())
      .then((data) => setActivity(data.activity || []))
      .finally(() => setLoading(false))
  }, [taskId, refreshKey])

  const describeActivity = (a: Activity) => {
    switch (a.action) {
      case "created task":
        return `created this task`
      case "renamed task":
        return `renamed this task to "${a.new_value}"`
      case "moved task":
        return `moved this task from ${a.old_value} to ${a.new_value}`
      case "changed priority":
        return `changed priority from ${a.old_value} to ${a.new_value}`
      case "changed assignee":
        return `changed assignee from ${a.old_value} to ${a.new_value}`
      case "changed due date":
        return a.new_value
          ? `set due date to ${a.new_value}`
          : `removed the due date`
      case "updated description":
        return `updated the description`
      default:
        return a.action
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading activity...</p>
  if (activity.length === 0) return <p className="text-sm text-gray-400">No activity yet</p>

  return (
    <div className="space-y-3 max-h-48 overflow-y-auto">
      {activity.map((a) => (
        <div key={a.id} className="flex gap-2 text-sm">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">
              {a.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-900 font-medium">{a.name}</span>{" "}
            <span className="text-gray-500">{describeActivity(a)}</span>
            <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(a.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}