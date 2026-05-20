import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

export async function authenticateApiRequest(req: NextRequest) {
  // 1. Check for API Key in Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("users API-Key ")) {
    const apiKey = authHeader.replace("users API-Key ", "").trim();
    
    if (apiKey) {
      const user = await prisma.user.findUnique({
        where: { apiKey },
      });

      if (user) {
        return { authorized: true, user, authType: "api_key" as const };
      }
    }
    
    // If API key is present but invalid, we reject immediately
    // or we could fallback to session, but usually if they send an API key they mean to use it.
    // Let's fallback just in case or return false.
    return { authorized: false, user: null, authType: null };
  }

  // 2. Fallback to NextAuth session
  const session = await auth();
  if (session?.user) {
    return { authorized: true, user: session.user, authType: "session" as const };
  }

  // 3. Unauthorized
  return { authorized: false, user: null, authType: null };
}
