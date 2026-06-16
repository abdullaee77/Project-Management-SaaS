'use client'

import { useState, useEffect, useRef } from "react"

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (type: string) => type.startsWith("image/")

const fileIcon = (type: string) => {
  if (type === "application/pdf") return "📄"
  if (type.includes("word")) return "📝"
  if (type === "text/plain") return "📃"
  return "📎"
}

export default function TaskAttachments({
  taskId,
  currentUserId,
  canEdit,
}: {
  taskId: string
  currentUserId: string
  canEdit: boolean
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/attachments`)
      .then((res) => res.json())
      .then((data) => setAttachments(data.attachments || []))
      .finally(() => setLoading(false))
  }, [taskId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setAttachments((prev) => [data.attachment, ...prev])

    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Delete this file?")) return

    const res = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading attachments...</p>

  return (
    
    <div>
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
          {error}
        </div>
      )}

      {attachments.length === 0 && !uploading && (
        <p className="text-sm text-gray-400 mb-2">No files attached</p>
      )}

      <div className="space-y-2 mb-3">
        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
            {isImage(att.file_type) ? (
              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={att.file_url} alt={att.file_name} className="w-10 h-10 object-cover rounded-md" />
              </a>
            ) : (
              <span className="text-xl flex-shrink-0">{fileIcon(att.file_type)}</span>
            )}

           <div className="flex-1 min-w-0">
               <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-900 hover:underline truncate block"
              >
                {att.file_name}
              </a>
              <p className="text-xs text-gray-400">
                {formatFileSize(att.file_size)} · {att.uploaded_by_name}
              </p>
            </div>

            {(canEdit || att.uploaded_by === currentUserId) && (
              <button
                onClick={() => handleDelete(att.id)}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
      >
        {uploading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          "+ Attach file"
        )}
      </button>
      <p className="text-xs text-gray-400 mt-1">Images, PDF, Word, or text. Max 10MB.</p>
    </div>
  )
}