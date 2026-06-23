import type { Metadata } from "next"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"

import { CreateUserForm } from "@/components/users/create-user-form"

export const metadata: Metadata = { title: "Create User" }

export default async function Page() {
  const session = await auth()
  const role = (session?.user as any)?.role?.toLowerCase()

  if (role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground dark:text-white">Create New User</p>
          </div>
          
          <div className="p-6 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-[#1A1A1A] mt-4">
            <CreateUserForm />
          </div>
        </div>
      </div>
    </div>
  )
}
