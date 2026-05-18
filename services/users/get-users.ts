import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma"

interface GetUsersParams {
  q?: string
  role?: string
}

export async function getUsers({ q, role }: GetUsersParams) {
  const where: any = {}

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ]
  }

  if (role && role !== "ALL") {
    // role param from URL comes as uppercase usually from ActionsContainer e.g. "ADMIN", "GIC"
    where.role = role.toLowerCase() as Role
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return users
}
