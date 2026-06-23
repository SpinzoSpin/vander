import { NextRequest } from "next/server"
import { withErrorHandler, badRequest, successResponse, unauthorized, notFound } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { authenticateApiRequest } from "@/lib/auth-api-key"

export const GET = withErrorHandler(async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
    const authResult = await authenticateApiRequest(req)
    if (!authResult.authorized) return unauthorized("Requires authentication")

    const params = await props.params
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
        return badRequest("Invalid transaction ID")
    }

    const transaction = await prisma.transactions.findUnique({
        where: { id }
    })

    if (!transaction) {
        return notFound("Transaction not found")
    }

    // Map to camelCase and hide relational/sensitive data
    const camelCaseTransaction = {
        id: transaction.id,
        batchId: transaction.batch_id,
        amountPhp: transaction.amount_php ? Number(transaction.amount_php) : null,
        amountUsdt: transaction.amount_usdt ? Number(transaction.amount_usdt) : null,
        gasFee: transaction.gas_fee ? Number(transaction.gas_fee) : null,
        networkId: transaction.network_id,
        status: transaction.status,
        fiatSettlementId: transaction.fiat_settlement_id,
        updatedAt: transaction.updated_at,
        createdAt: transaction.created_at,
        type: transaction.type,
        treasuryId: transaction.treasury_id,
        targetAddress: transaction.target_address,
        txHash: transaction.tx_hash,
        failReason: transaction.fail_reason,
        orderId: transaction.order_id,
        bankDetails: transaction.bank_details,
        receivedRecordId: transaction.received_record_id,
        sendingRecordId: transaction.sending_record_id,
        notes: transaction.notes,
        invoiceImageId: transaction.invoice_image_id,
        usdtToPhpReferenceRateSnapshot: transaction.usdt_to_php_reference_rate_snapshot ? Number(transaction.usdt_to_php_reference_rate_snapshot) : null,
        usdtToPhpRateSnapshot: transaction.usdt_to_php_rate_snapshot ? Number(transaction.usdt_to_php_rate_snapshot) : null,
        phpToUsdtReferenceRateSnapshot: transaction.php_to_usdt_reference_rate_snapshot ? Number(transaction.php_to_usdt_reference_rate_snapshot) : null,
        phpToUsdtRateSnapshot: transaction.php_to_usdt_rate_snapshot ? Number(transaction.php_to_usdt_rate_snapshot) : null,
        rateSnapshot: transaction.rate_snapshot ? Number(transaction.rate_snapshot) : null,
        referenceRateSnapshot: transaction.reference_rate_snapshot ? Number(transaction.reference_rate_snapshot) : null,
        appliedRateSnapshot: transaction.applied_rate_snapshot ? Number(transaction.applied_rate_snapshot) : null,
    };

    return successResponse(camelCaseTransaction)
})
