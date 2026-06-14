'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
}

interface MemberListProps {
  workspaceId: string
  members: Member[]
  invitations: Invitation[]
  myRole: string
  myUserId: string
}

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-700",
  viewer: "bg-gray-100 text-gray-500",
}

export default function MemberList({
  workspaceId,
  members,
  invitations,
  myRole,
  myUserId,
}: MemberListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const canManage = myRole === "owner" || myRole === "admin"

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoadingId(memberId)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the workspace?")) return
    setLoadingId(memberId)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      })
      if (res.ok) router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleCancelInvite = async (invitationId: string) => {
    setLoadingId(invitationId)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/invite/${invitationId}`, {
        method: "DELETE",
      })
      if (res.ok) router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Active Members */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            Members ({members.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((member) => {
            const isSelf = member.id === myUserId
            const canEditThis = canManage && member.role !== "owner" && !isSelf

            return (
              <div key={member.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-medium text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.name} {isSelf && <span className="text-gray-400">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canEditThis ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={loadingId === member.id}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-blue-500 capitalize"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[member.role]}`}>
                      {member.role}
                    </span>
                  )}

                  {canEditThis && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={loadingId === member.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {canManage && invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              Pending invitations ({invitations.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <p className="text-xs text-gray-400 capitalize">Invited as {invite.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">
                    Pending
                  </span>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    disabled={loadingId === invite.id}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}