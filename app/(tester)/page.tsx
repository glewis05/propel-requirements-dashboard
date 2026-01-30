import { redirect } from "next/navigation"

// Tester portal home redirects to My Tests
export default function TesterHomePage() {
  redirect("/my-tests")
}
