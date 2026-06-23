import { object, string, email } from "zod"

export const signInSchema = object({
    email: email().min(1, "Email is required"),
    password: string()
        .min(1, "Password is required")
        .min(8, "Password must be more than 8 characters")
        .max(32, "Password must be less than 32 characters"),
})