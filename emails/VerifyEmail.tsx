export default function VerifyEmail({ name, verifyUrl }: { name: string, verifyUrl: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", padding: "40px 20px", backgroundColor: "#ffffff" }}>
      <h1 style={{ color: "#111827", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        Verify your email
      </h1>
      <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "24px" }}>
        Hi {name}, thanks for signing up for Taskly. Click the button below to verify your email address.
      </p>
      <a href={verifyUrl} style={{ display: "inline-block", backgroundColor: "#2563eb", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px", marginBottom: "24px" }}>
        Verify Email
      </a>
      <p style={{ color: "#9ca3af", fontSize: "14px" }}>
        This link expires in 24 hours. If you did not create an account, ignore this email.
      </p>
      <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
        Or copy this link: {verifyUrl}
      </p>
    </div>
  )
}