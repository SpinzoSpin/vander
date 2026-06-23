import type { Metadata } from "next"
import { Register } from "@/components/auth/register"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Sign Up" }

export default async function SignUpPage() {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    redirect("/signin")
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Register />
    </div>
  )
}
