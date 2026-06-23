"use server"

import { revalidatePath } from "next/cache";
import { auth } from "@/auth/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function addNotifierChatIdAction(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const role = (session.user as any).role?.toLowerCase();
    if (role !== "admin") {
      return { success: false, message: "Forbidden: Admins only" };
    }

    const chatId = formData.get("chatId")?.toString().trim();
    if (!chatId) {
      return { success: false, message: "Chat ID is required" };
    }

    // Verify it is a valid numeric ID (Telegram chat IDs are numbers)
    if (!/^-?\d+$/.test(chatId)) {
      return { success: false, message: "Invalid Chat ID format. Must be a numeric value." };
    }

    // Check if it's already in the database
    const existing = await prisma.telegram.findUnique({
      where: { chat_id: chatId }
    });
    if (existing) {
      return { success: false, message: "Chat ID is already in the allowed list" };
    }

    // Check if it's already in the static TELEGRAM_CHAT_ID env
    if (process.env.TELEGRAM_CHAT_ID) {
      const envIds = process.env.TELEGRAM_CHAT_ID.split(",").map(id => id.trim());
      if (envIds.includes(chatId)) {
        return { success: false, message: "Chat ID is already statically configured in environment variables" };
      }
    }

    // Insert to DB
    await prisma.telegram.create({
      data: { chat_id: chatId }
    });

    logger.info({ chatId }, "Added new Telegram chat ID to allowed list database");
    revalidatePath("/dashboard/notifier");

    return { success: true, message: "Telegram Chat ID added successfully" };
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to add Telegram Chat ID");
    return { success: false, message: "Failed to add Telegram Chat ID: " + error.message };
  }
}

export async function deleteNotifierChatIdAction(chatId: string) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const role = (session.user as any).role?.toLowerCase();
    if (role !== "admin") {
      return { success: false, message: "Forbidden: Admins only" };
    }

    // Check if it exists in the database
    const existing = await prisma.telegram.findUnique({
      where: { chat_id: chatId }
    });
    if (!existing) {
      return { success: false, message: "Chat ID not found in allowed list database" };
    }

    // Delete from DB
    await prisma.telegram.delete({
      where: { chat_id: chatId }
    });

    logger.info({ chatId }, "Deleted Telegram chat ID from allowed list database");
    revalidatePath("/dashboard/notifier");

    return { success: true, message: "Telegram Chat ID deleted successfully" };
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to delete Telegram Chat ID");
    return { success: false, message: "Failed to delete Telegram Chat ID: " + error.message };
  }
}
