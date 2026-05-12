export { auth as proxy } from "@/auth/auth"

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}