import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const storyId = params.id
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { related_stories, parent_story_id } = body

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (related_stories !== undefined) {
      updateData.related_stories = related_stories
    }

    if (parent_story_id !== undefined) {
      updateData.parent_story_id = parent_story_id
    }

    // Fetch current story version
    const { data: currentStory, error: fetchError } = await supabase
      .from("user_stories")
      .select("version")
      .eq("story_id", storyId)
      .single()

    if (fetchError || !currentStory) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      )
    }

    // Update version
    updateData.version = currentStory.version + 1

    // Update the story
    const { error: updateError } = await supabase
      .from("user_stories")
      .update(updateData)
      .eq("story_id", storyId)

    if (updateError) {
      console.error("Error updating story relationships:", updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }
}
