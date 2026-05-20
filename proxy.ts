import NextAuth from "next-auth"
import { authConfig } from "./auth/auth.config"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

export default async function proxy(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth as any)(request)
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|.*\\.png$).*)'],
};