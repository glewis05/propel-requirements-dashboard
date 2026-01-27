import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Requirements Dashboard | Providence",
  description: "Interactive requirements management and approval workflow for Providence programs",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  )
}
