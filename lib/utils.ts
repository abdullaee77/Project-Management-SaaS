import { resend } from "./resend"
import VerifyEmail from "@/emails/VerifyEmail"
import ResetPassword from "@/emails/ResetPassword"
import WelcomeEmail from "@/emails/WelcomeEmail"
import InviteEmail from "@/emails/InviteEmail"
const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`

  console.log("Sending verification email to:", email)
  console.log("Verify URL:", verifyUrl)

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your Taskly account",
    react: VerifyEmail({ name, verifyUrl }),
  })

  console.log("Resend result:", result)
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Taskly password",
    react: ResetPassword({ name, resetUrl }),
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Taskly!",
    react: WelcomeEmail({ name }),
  })
}

export async function sendInviteEmail(
  email: string,
  workspaceName: string,
  token: string,
  role: string
) {
  const inviteUrl = `${APP_URL}/invite?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${workspaceName} on Taskly`,
    react: InviteEmail({ workspaceName, inviteUrl, role }),
  })
}