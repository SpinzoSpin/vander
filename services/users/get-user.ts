import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt"

export async function getUser(email: string, password: string) {
    const result = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (!result) return null

    const isPasswordMatch = bcrypt.compareSync(password, result.password)

    if (!isPasswordMatch) return null

    return result
}