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

// ─── Update User ────────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role),
  password: z
    .string()
    .max(32, "Password must be less than 32 characters")
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters"
    ),
})

export async function updateUserAction(formData: FormData) {
  try {
    const session = await auth()
    const currentRole = (session?.user as any)?.role?.toLowerCase()

    if (currentRole !== "admin") {
      return { error: "Forbidden: You do not have permission to update users" }
    }

    const raw = Object.fromEntries(formData.entries())

    // Treat empty password as undefined (no change)
    const parsed = updateUserSchema.parse({
      ...raw,
      password: raw.password && String(raw.password).length > 0 ? raw.password : undefined,
    })

    // Check if email is taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (existingUser && existingUser.id !== parsed.userId) {
      return { error: "Another user with this email already exists" }
    }

    const updateData: Record<string, unknown> = {
      email: parsed.email,
      role: parsed.role,
    }

    if (parsed.password) {
      updateData.password = saltAndHashPassword(parsed.password)
    }

    await prisma.user.update({
      where: { id: parsed.userId },
      data: updateData,
    })

    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error) {
    console.log({ error }, "Failed to update user")
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    return { error: "Something went wrong" }
  }
}

// ─── Delete User ────────────────────────────────────────────────────────────────

export async function deleteUserAction(userId: string) {
  try {
    const session = await auth()
    const currentRole = (session?.user as any)?.role?.toLowerCase()

    if (currentRole !== "admin") {
      return { error: "Forbidden: You do not have permission to delete users" }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error) {
    console.log({ error }, "Failed to delete user")
    return { error: "Something went wrong" }
  }
}
