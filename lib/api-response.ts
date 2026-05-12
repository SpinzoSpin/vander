import { NextResponse } from "next/server"

// --- Standard Response Formats ---

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: any
}

export function successResponse<T>(data?: T, message: string = "Success", status: number = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status }
  )
}

export function errorResponse(message: string, status: number = 500, errorDetails?: any) {
  return NextResponse.json(
    { success: false, message, error: errorDetails },
    { status }
  )
}

// --- Quick Helpers ---

export function badRequest(message: string = "Bad Request", errors?: any) {
  return errorResponse(message, 400, errors)
}

export function unauthorized(message: string = "Unauthorized") {
  return errorResponse(message, 401)
}

export function forbidden(message: string = "Forbidden") {
  return errorResponse(message, 403)
}

export function notFound(message: string = "Not Found") {
  return errorResponse(message, 404)
}

export function serverError(message: string = "Internal Server Error", error?: any) {
  return errorResponse(message, 500, error)
}

// --- Custom Error Classes for Throwing ---

export class ApiError extends Error {
  statusCode: number
  details?: any

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.details = details
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = "Bad Request", details?: any) {
    super(message, 400, details)
    this.name = "BadRequestError"
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message, 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(message, 403)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Not Found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

// --- Route Handler Wrapper ---

/**
 * A wrapper for Next.js App Router API handlers.
 * It catches thrown ApiErrors (and standard errors) and formats them into standardized JSON responses.
 * 
 * @example
 * export const GET = withErrorHandler(async (req) => {
 *   const user = await getUser()
 *   if (!user) throw new UnauthorizedError("Please log in first")
 *   return successResponse(user)
 * })
 */
export function withErrorHandler(
  handler: (req: Request, ...args: any[]) => Promise<NextResponse> | NextResponse
) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args)
    } catch (error: any) {
      console.error(`[API Error] ${req.method} ${req.url}:`, error)

      // Handle our custom thrown API errors
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.statusCode, error.details)
      }

      // Automatically handle Zod validation errors if Zod is thrown
      if (error?.name === "ZodError") {
        return badRequest("Validation Error", error.errors || error.issues)
      }

      // Handle generic errors (like Prisma errors)
      return serverError("An unexpected error occurred.", process.env.NODE_ENV === "development" ? error.message : undefined)
    }
  }
}
