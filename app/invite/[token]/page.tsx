import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import AcceptInviteButton from "@/components/workspace/AcceptInviteButton"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()

  const result = await db.query(
    `SELECT i.*, w.name as workspace_name
     FROM invitations i
     INNER JOIN workspaces w ON w.id = i.workspace_id
     WHERE i.token = $1`,
    [token]
  )

  // Wrapper for all states
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {children}
      </div>
    </div>
  )

  // Invalid token
  if (result.rows.length === 0) {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid invitation</h2>
        <p className="text-gray-500 mb-6">This invitation link doesn't exist or has been removed.</p>
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Back to login</Link>
      </Wrapper>
    )
  }

  const invite = result.rows[0]

  // Already used
  if (invite.status !== "pending") {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation already used</h2>
        <p className="text-gray-500 mb-6">This invitation has already been accepted or declined.</p>
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Back to login</Link>
      </Wrapper>
    )
  }

  // Expired
  if (new Date(invite.expires_at) < new Date()) {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation expired</h2>
        <p className="text-gray-500 mb-6">
          This invitation expired. Ask {invite.workspace_name}'s admin to send a new one.
        </p>
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Back to login</Link>
      </Wrapper>
    )
  }

  // Not logged in
  if (!session?.user) {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Join {invite.workspace_name}
        </h2>
        <p className="text-gray-500 mb-6">
          You've been invited as <strong className="capitalize">{invite.role}</strong>. 
          Sign in or create an account with <strong>{invite.email}</strong> to accept.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/login?callbackUrl=/invite/${token}`}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href={`/signup?callbackUrl=/invite/${token}`}
            className="w-full py-2.5 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </Wrapper>
    )
  }

  // Logged in with wrong email
  if (session.user.email !== invite.email) {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wrong account</h2>
        <p className="text-gray-500 mb-6">
          This invitation was sent to <strong>{invite.email}</strong>, but you're signed in as{" "}
          <strong>{session.user.email}</strong>.
        </p>
        <Link href="/api/auth/signout" className="text-blue-600 font-medium hover:underline">
          Sign out and try again
        </Link>
      </Wrapper>
    )
  }

  // Logged in with correct email — show accept button
  return (
    <Wrapper>
      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span className="text-white font-bold text-xl">
          {invite.workspace_name.charAt(0).toUpperCase()}
        </span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Join {invite.workspace_name}
      </h2>
      <p className="text-gray-500 mb-6">
        You've been invited as a <strong className="capitalize">{invite.role}</strong>.
      </p>
      <AcceptInviteButton token={token} />
    </Wrapper>
  )
}