"use server";

import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/auth/salt";
import { z } from "zod";
import { Role } from "@/generated/prisma";

const registerSchema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(32, "Password must be less than 32 characters"),
});

export async function registerAction(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const { email, password } = registerSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User already exists" };
    }

    const hashedPassword = saltAndHashPassword(password);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.admin
      },
    });

    return { success: true };
  } catch (error) {
    console.log({ error }, "Failed to sign-in/sign-up")
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Something went wrong" };
  }
}
