import { NextRequest } from "next/server"
import {
  withErrorHandler,
  badRequest,
  successResponse,
  unauthorized,
} from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { authenticateApiRequest } from "@/lib/auth-api-key"

export const POST = withErrorHandler(async (req: NextRequest, props: { params: Promise<{ orderId: string }> }) => {
  const authResult = await authenticateApiRequest(req)
  if (!authResult.authorized) return unauthorized("Requires authentication")

  // Only admin or API Key holder can upload tx hash
  if (authResult.authType === "session") {
    const role = (authResult.user as any)?.role?.toLowerCase()
    if (role !== "admin") {
      return unauthorized("Only admins can upload transaction hashes via session")
    }
  }

  const params = await props.params
  const orderId = params.orderId

  if (!orderId) {
    return badRequest("orderId parameter is required")
  }

  const body = await req.json()
  const { txHash } = body as {
    txHash: string
  }

  if (!txHash || typeof txHash !== "string" || txHash.trim().length === 0) {
    return badRequest("txHash must be a non-empty string")
  }

  const cleanTxHash = txHash.trim()

  // Verify the transaction exists
  const transaction = await prisma.transactions.findFirst({
    where: { order_id: orderId },
  })

  if (!transaction) {
    return badRequest("Transaction not found")
  }

  // Check for duplication: Ensure txHash is not already claimed by another transaction
  const duplicateTx = await prisma.transactions.findFirst({
    where: {
      tx_hash: cleanTxHash,
      NOT: { id: transaction.id },
    },
  })

  if (duplicateTx) {
    return badRequest(
      `Transaction hash "${cleanTxHash}" has already been submitted for transaction #${duplicateTx.id}`
    )
  }

  // Update the transaction with the tx hash
  const updated = await prisma.transactions.update({
    where: { id: transaction.id },
    data: {
      tx_hash: cleanTxHash,
      updated_at: new Date(),
    },
  })

  // Trigger BullMQ worker verification asynchronously
  import("@/services/queues/onchain-queue")
    .then(({ enqueueOnchainTxWatch }) => {
      enqueueOnchainTxWatch(updated.id)
    })
    .catch((err) => {
      console.error("Failed to enqueue transaction in BullMQ:", err)
    })

  return successResponse(
    { id: updated.id, txHash: updated.tx_hash },
    "Transaction hash uploaded successfully"
  )
})