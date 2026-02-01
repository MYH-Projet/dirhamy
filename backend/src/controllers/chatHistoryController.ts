import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, JwtPayload } from "../Middleware/authMiddleware";

const MAX_MESSAGES = 100;

// ============================================================================
// CONVERSATION ENDPOINTS
// ============================================================================

/**
 * Get all conversations for the authenticated user
 * GET /api/ai/conversations
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        const conversations = await prisma.conversation.findMany({
            where: { utilisateurId: userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { content: true, sender: true }
                }
            },
        });

        // Format with lastMessage preview
        const formatted = conversations.map(c => ({
            id: c.id,
            title: c.title,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            lastMessage: c.messages[0]?.content.substring(0, 50) || null
        }));

        return res.json({ conversations: formatted });
    } catch (error) {
        console.error("❌ Error fetching conversations:", error);
        return res.status(500).json({ error: "Failed to fetch conversations" });
    }
};

/**
 * Create a new conversation
 * POST /api/ai/conversations
 */
export const createConversation = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        const conversation = await prisma.conversation.create({
            data: {
                utilisateurId: userId,
                title: "New Chat",
            },
        });

        console.log(`📝 Created conversation ${conversation.id} for user ${userId}`);
        return res.status(201).json({ conversation });
    } catch (error) {
        console.error("❌ Error creating conversation:", error);
        return res.status(500).json({ error: "Failed to create conversation" });
    }
};

/**
 * Delete a conversation
 * DELETE /api/ai/conversations/:id
 */
export const deleteConversation = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);
        const conversationId = Number(req.params.id);

        if (isNaN(userId) || isNaN(conversationId)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        // Verify ownership
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, utilisateurId: userId }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Delete (cascade will handle messages)
        await prisma.conversation.delete({
            where: { id: conversationId }
        });

        console.log(`🗑️ Deleted conversation ${conversationId}`);
        return res.json({ success: true });
    } catch (error) {
        console.error("❌ Error deleting conversation:", error);
        return res.status(500).json({ error: "Failed to delete conversation" });
    }
};

/**
 * Update conversation title
 * PATCH /api/ai/conversations/:id
 */
export const updateConversation = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);
        const conversationId = Number(req.params.id);
        const { title } = req.body;

        if (isNaN(userId) || isNaN(conversationId)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        // Verify ownership
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, utilisateurId: userId }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { title }
        });

        return res.json({ conversation: updated });
    } catch (error) {
        console.error("❌ Error updating conversation:", error);
        return res.status(500).json({ error: "Failed to update conversation" });
    }
};

// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================

/**
 * Get messages for a specific conversation
 * GET /api/ai/conversations/:id/messages
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as JwtPayload;
        const userId = Number(user.id);
        const conversationId = Number(req.params.id);

        if (isNaN(userId) || isNaN(conversationId)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        // Verify ownership
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, utilisateurId: userId }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            take: MAX_MESSAGES,
            select: {
                id: true,
                content: true,
                sender: true,
                createdAt: true,
            },
        });

        return res.json({ messages, conversation });
    } catch (error) {
        console.error("❌ Error fetching messages:", error);
        return res.status(500).json({ error: "Failed to fetch messages" });
    }
};

/**
 * Save a message to a conversation (used internally by aiChatController)
 */
export const saveMessage = async (
    conversationId: number,
    content: string,
    sender: "user" | "ai"
): Promise<void> => {
    try {
        console.log(`💾 Saving ${sender} message to conversation ${conversationId}`);

        await prisma.chatMessage.create({
            data: {
                conversationId,
                content,
                sender,
            },
        });

        // Update conversation's updatedAt timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Auto-title from first user message
        if (sender === "user") {
            const conv = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { messages: { take: 1 } }
            });
            if (conv && conv.title === "New Chat" && conv.messages.length === 0) {
                const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { title }
                });
                console.log(`📝 Auto-titled conversation: "${title}"`);
            }
        }

        console.log(`✅ Message saved successfully`);
    } catch (error) {
        console.error("❌ Error saving chat message:", error);
        // Don't throw - chat should continue even if save fails
    }
};

/**
 * Get or create a conversation for the user (helper for aiChatController)
 */
export const getOrCreateConversation = async (
    userId: number,
    conversationId?: number
): Promise<number> => {
    // If conversationId provided, verify it exists and belongs to user
    if (conversationId) {
        const existing = await prisma.conversation.findFirst({
            where: { id: conversationId, utilisateurId: userId }
        });
        if (existing) return existing.id;
    }

    // Create new conversation
    const newConv = await prisma.conversation.create({
        data: {
            utilisateurId: userId,
            title: "New Chat",
        },
    });
    console.log(`📝 Auto-created conversation ${newConv.id} for user ${userId}`);
    return newConv.id;
};
