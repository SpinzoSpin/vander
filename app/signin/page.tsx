import { redirect } from "next/navigation"
import { signIn, auth } from "@/auth/auth"
import { AuthError } from "next-auth"
import { SignIn } from "../../components/auth/sign-in"

const SIGNIN_ERROR_URL = "/error"

export default async function SignInPage(props: {
  searchParams: { callbackUrl: string | undefined }
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <SignIn />
    </div>
  )
}
