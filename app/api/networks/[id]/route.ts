import { BadRequestError, successResponse, unauthorized, withErrorHandler } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { UpdateNetworkParamsSchema } from "@/services/networks/dto-network";
import { updateNetwork } from "@/services/networks/update-network";
import { authenticateApiRequest } from "@/lib/auth-api-key";

export const PUT = withErrorHandler(async (req, context: { params: Promise<{ id: string }> }) => {
    const authResult = await authenticateApiRequest(req)
    if (!authResult.authorized) return unauthorized("Requires authentication")

    const role = (authResult.user as any)?.role?.toLowerCase()
    if (role !== "admin") {
        return unauthorized("Only admins can update networks")
    }

    const payload = await req.json()
    const params = (await context.params)
    logger.info({ params, payload, networkId: params.id }, "Requesting to update one of the network")
    const networkId = params.id

    if (!networkId) throw new BadRequestError("id of the network is required to update")

    const validate = await UpdateNetworkParamsSchema.safeParseAsync({
        id: Number(networkId),
        ...payload
    })

    if (!validate.success) throw new BadRequestError("Invalid request", validate.error)

    const result = await updateNetwork(Number(networkId), validate.data)

    return successResponse({ networkId: networkId, result })

})