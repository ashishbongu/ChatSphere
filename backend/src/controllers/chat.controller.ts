import { Response } from "express";
import * as chatService from "../services/chat.service";
import { AuthRequest } from "../middleware/auth.middleware";

// CREATE DIRECT CHAT
export const createDirectChat = async (req: AuthRequest, res: Response) => {
    try {
        const { otherUserId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!otherUserId) {
            return res.status(400).json({
                success: false,
                message: "otherUserId is required",
            });
        }

        const chat = await chatService.createDirectChat(userId, otherUserId);

        res.status(200).json({
            success: true,
            data: chat,
            message: "Direct chat created/retrieved successfully",
        });
    } catch (error: any) {
        if (error.message === "Forbidden: You are not a member of this chat") {
            return res.status(403).json({
                success: false,
                message: error.message,
            });
        }

        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// GET ALL CHATS
export const getUserChats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const chats = await chatService.getUserChats(userId);

        res.status(200).json({
            success: true,
            data: chats,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// GET CHAT BY ID
export const getChat = async (req: AuthRequest, res: Response) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required",
            });
        }

        const chat = await chatService.getChatById(chatId, userId);

        res.status(200).json({
            success: true,
            data: chat,
        });
    } catch (error: any) {
        if (error.message === "Forbidden: You are not a member of this chat") {
            return res.status(403).json({
                success: false,
                message: error.message,
            });
        }
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
