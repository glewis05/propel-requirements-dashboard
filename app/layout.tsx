import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "TraceWell | The Compliance Backbone for Healthcare Innovation",
  description: "Helping providers build custom digital experiences with full FDA Part 11 and HIPAA traceability. Powered by Propel Health.",
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
