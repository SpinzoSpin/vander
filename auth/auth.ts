import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import type { Provider } from "next-auth/providers"
import { getUser } from "@/services/users/get-user"
import { signInSchema } from "@/lib/validations/zod"
import { authConfig } from "./auth.config"

const providers: Provider[] = [
    Credentials({
        credentials: {
            email: {},
            password: {},
        },
        authorize: async (credentials) => {
            let user = null

            const { email, password } = await signInSchema.parseAsync(credentials)

            user = await getUser(email, password)

            if (!user) {
                throw new Error("Invalid credentials.")
            }

            return user
        },
    }),

]

export const providerMap = providers
    .map((provider) => {
        if (typeof provider === "function") {
            const providerData = provider()
            return { id: providerData.id, name: providerData.name }
        } else {
            return { id: provider.id, name: provider.name }
        }
    })
    .filter((provider) => provider.id !== "credentials")

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: PrismaAdapter(prisma as any),
    providers: providers,
    session: {
        strategy: "jwt",
    },
    debug: true,
})