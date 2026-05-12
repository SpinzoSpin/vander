import { prisma } from "@/lib/prisma";
import { TGetNetworkByStatusSchema } from "./dto-network";

export async function getNetworks(limit: number, offset: number, page: number, filterBy: TGetNetworkByStatusSchema["filterBy"]) {
    // Determine the where clause based on the filter status
    const where: Record<string, boolean> = {};

    if (filterBy === "active") {
        where.is_active = true;
    } else if (filterBy === "disable") {
        where.is_active = false;
    }

    // Calculate skip for pagination. If offset is provided, use it, otherwise use page math.
    const skip = offset > 0 ? offset : (page - 1) * limit;

    // Run a transaction to safely get the exact total count alongside the paginated data
    const [total, data] = await prisma.$transaction([
        prisma.networks.count({ where }),
        prisma.networks.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
        }),
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}