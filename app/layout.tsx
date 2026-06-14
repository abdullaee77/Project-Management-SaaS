import type { Metadata } from "next"
import "./globals.css"
import SessionProvider from "@/components/shared/SessionProvider"

export const metadata: Metadata = {
  title: "Taskly",
  description: "Multi-tenant project management platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}