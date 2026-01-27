"use client"

import { AlertCircle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#fafafa"
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            borderRadius: "0.5rem",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e5e5",
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <AlertCircle style={{ height: "3rem", width: "3rem", color: "#dc2626", margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              A critical error occurred. Please try again.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem", fontFamily: "monospace" }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                borderRadius: "0.375rem",
                backgroundColor: "#2563eb",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "white",
                border: "none",
                cursor: "pointer"
              }}
            >
              <RefreshCw style={{ height: "1rem", width: "1rem" }} />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
