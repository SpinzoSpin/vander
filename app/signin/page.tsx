import { redirect } from "next/navigation"
import { signIn, auth } from "@/auth/auth"
import { AuthError } from "next-auth"
import { SignIn } from "../../components/auth/sign-in"

const SIGNIN_ERROR_URL = "/error"

export default async function SignInPage(props: {
  searchParams: { callbackUrl: string | undefined }
}) {
  const session = await auth()
  if (session?.user) {
    const role = (session.user as any).role?.toLowerCase()
    if (role === "gic" || role === "lotto") {
      redirect("/dashboard/operations/fiat-to-crypto")
    } else {
      redirect("/dashboard")
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <SignIn />
    </div>
  )
}
