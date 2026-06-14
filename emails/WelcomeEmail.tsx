export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", padding: "40px 20px", backgroundColor: "#ffffff" }}>
      <h1 style={{ color: "#111827", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        Welcome to Taskly 🎉
      </h1>
      <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "24px" }}>
        Hi {name}, your account is verified and ready to go. Start by creating your first workspace.
      </p>
      <a href={process.env.NEXT_PUBLIC_APP_URL} style={{ display: "inline-block", backgroundColor: "#2563eb", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
        Go to Taskly
      </a>
    </div>
  )
}