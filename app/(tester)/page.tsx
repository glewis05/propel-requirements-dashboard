"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Tester portal home redirects to My Tests
export default function TesterHomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/my-tests")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
