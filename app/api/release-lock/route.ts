import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const storyId = searchParams.get("storyId")

  if (!storyId) {
    return NextResponse.json({ error: "Missing storyId" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    await supabase.rpc("release_story_lock", {
      p_story_id: storyId,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error releasing lock:", error)
    return NextResponse.json({ error: "Failed to release lock" }, { status: 500 })
  }
}

// Also handle GET for sendBeacon which might send GET requests
export async function GET(request: NextRequest) {
  return POST(request)
}
