import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, JwtPayload } from "../Middleware/authMiddleware";

const MAX_MESSAGES = 100;

/**
 * Get chat history for the authenticated user
 * GET /api/chat/history
 */
export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { utilisateurId: userId },
            orderBy: { createdAt: "asc" },
            take: MAX_MESSAGES,
            select: {
                id: true,
                content: true,
                sender: true,
                createdAt: true,
            },
        });

        return res.json({ messages });
    } catch (error) {
        console.error("❌ Error fetching chat history:", error);
        return res.status(500).json({ error: "Failed to fetch chat history" });
    }
};

/**
 * Clear all chat history for the authenticated user
 * DELETE /api/chat/history
 */
export const clearHistory = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        const deleted = await prisma.chatMessage.deleteMany({
            where: { utilisateurId: userId },
        });

        console.log(`🗑️ Deleted ${deleted.count} messages for user ${userId}`);
        return res.json({ success: true, deletedCount: deleted.count });
    } catch (error) {
        console.error("❌ Error clearing chat history:", error);
        return res.status(500).json({ error: "Failed to clear chat history" });
    }
};

/**
 * Save a message to chat history (used internally by aiChatController)
 */
export const saveMessage = async (
    userId: number,
    content: string,
    sender: "user" | "ai"
): Promise<void> => {
    try {
        console.log(`💾 Saving ${sender} message for user ${userId}: "${content.substring(0, 50)}..."`);

        // First verify the user exists
        const userExists = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!userExists) {
            console.error(`❌ User ${userId} does not exist in database!`);
            return;
        }

        await prisma.chatMessage.create({
            data: {
                utilisateurId: userId,
                content,
                sender,
            },
        });
        console.log(`✅ Message saved successfully`);
    } catch (error) {
        console.error("❌ Error saving chat message:", error);
        // Don't throw - chat should continue even if save fails
    }
};

