export default function InviteEmail({ workspaceName, inviteUrl, role }: { workspaceName: string, inviteUrl: string, role: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", padding: "40px 20px", backgroundColor: "#ffffff" }}>
      <h1 style={{ color: "#111827", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        You have been invited to {workspaceName}
      </h1>
      <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "24px" }}>
        You have been invited to join <strong>{workspaceName}</strong> on Taskly as a <strong>{role}</strong>. Click the button below to accept the invitation.
      </p>
      <a href={inviteUrl} style={{ display: "inline-block", backgroundColor: "#2563eb", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px", marginBottom: "24px" }}>
        Accept Invitation
      </a>
      <p style={{ color: "#9ca3af", fontSize: "14px" }}>
        This invitation expires in 7 days. If you do not have a Taskly account yet, you will be able to create one.
      </p>
      <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
        Or copy this link: {inviteUrl}
      </p>
    </div>
  )
}