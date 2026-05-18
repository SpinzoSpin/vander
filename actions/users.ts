"use server"

import { prisma } from "@/lib/prisma"
import { saltAndHashPassword } from "@/auth/salt"
import { z } from "zod"
import { Role } from "@/generated/prisma"
import { auth } from "@/auth/auth"
import { revalidatePath } from "next/cache"

const createUserSchema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(32, "Password must be less than 32 characters"),
  role: z.nativeEnum(Role),
})

export async function createUserAction(formData: FormData) {
  try {
    const session = await auth()
    const currentRole = (session?.user as any)?.role?.toLowerCase()

    if (currentRole !== "admin") {
      return { error: "Forbidden: You do not have permission to create users" }
    }

    const data = Object.fromEntries(formData.entries())
    const { email, password, role } = createUserSchema.parse(data)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    const hashedPassword = saltAndHashPassword(password)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role,
      },
    })

    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error) {
    console.log({ error }, "Failed to create user")
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    return { error: "Something went wrong" }
  }
}
