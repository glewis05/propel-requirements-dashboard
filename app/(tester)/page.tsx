import { redirect } from "next/navigation"

// Tester portal home redirects to My Tests
export default async function TesterHomePage() {
  redirect("/my-tests")

  // This won't be reached but satisfies the build
  return null
}
