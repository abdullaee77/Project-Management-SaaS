export default function ResetPassword({ name, resetUrl }: { name: string, resetUrl: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", padding: "40px 20px", backgroundColor: "#ffffff" }}>
      <h1 style={{ color: "#111827", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        Reset your password
      </h1>
      <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "24px" }}>
        Hi {name}, we received a request to reset your password. Click the button below to choose a new one.
      </p>
      <a href={resetUrl} style={{ display: "inline-block", backgroundColor: "#2563eb", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px", marginBottom: "24px" }}>
        Reset Password
      </a>
      <p style={{ color: "#9ca3af", fontSize: "14px" }}>
        This link expires in 1 hour. If you did not request a reset, ignore this email.
      </p>
      <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
        Or copy this link: {resetUrl}
      </p>
    </div>
  )
}