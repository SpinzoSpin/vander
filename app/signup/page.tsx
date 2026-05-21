import type { Metadata } from "next"
import { Register } from "@/components/auth/register"

export const metadata: Metadata = { title: "Sign Up" }

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Register />
    </div>
  )
}
