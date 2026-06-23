import { NextRequest } from "next/server"
import { withErrorHandler, badRequest, successResponse, unauthorized } from "@/lib/api-response"
import { s3Client } from "@/lib/s3"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@/lib/prisma"
import { authenticateApiRequest } from "@/lib/auth-api-key"

export const POST = withErrorHandler(async (req: NextRequest, props: { params: Promise<{ orderId: string }> }) => {
    const authResult = await authenticateApiRequest(req)
    if (!authResult.authorized) return unauthorized("Requires authentication")

    const params = await props.params
    const orderId = params.orderId

    if (!orderId) {
        return badRequest("orderId parameter is required")
    }

    console.log("Requesting with the orders: ")
    console.log({ orderId })

    const transaction = await prisma.transactions.findFirst({
        where: { order_id: orderId }
    })

    if (!transaction) {
        return badRequest("Transaction not found")
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const altText = (formData.get("alt") as string) || `Invoice image`

    if (!file) {
        return badRequest("No file uploaded")
    }

    // Validate file size (e.g., max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
        return badRequest("File size exceeds the 10MB limit")
    }

    // Validate MIME type
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return badRequest("Invalid file type. Only JPEG, PNG, WebP images and PDF documents are allowed.")
    }

    // 1. Convert file object to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2. Generate unique key under S3_ROOT_PATH
    const rootPath = process.env.S3_ROOT_PATH || "spinzopay_v2"
    const uniqueId = crypto.randomUUID()
    const extension = file.name.split(".").pop() || "png"
    const key = `${rootPath}/invoices/${transaction.id}/${uniqueId}.${extension}`

    // 3. Upload to S3-compatible bucket
    const bucketName = process.env.S3_BUCKET || ""
    await s3Client.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: file.type,
            ACL: "public-read",
        })
    )

    // 4. Construct public URL using S3_HOST_BUCKET
    const hostBucket = process.env.S3_HOST_BUCKET || `${bucketName}.${process.env.S3_HOST}`
    const fileUrl = `https://${hostBucket}/${key}`

    // 5. Create media record in Database
    const mediaRecord = await prisma.media.create({
        data: {
            alt: altText,
            url: fileUrl,
            filename: file.name,
            mime_type: file.type,
            filesize: file.size,
        },
    })

    // 6. Update transaction to link the media record ID
    await prisma.transactions.update({
        where: { id: transaction.id },
        data: {
            invoice_image_id: mediaRecord.id,
        },
    })

    return successResponse({ fileUrl }, "Invoice uploaded successfully")
})