import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isValidUUID(uuid: string) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
}

export const createDirectChat = async (userId: string, otherUserId: string) => {
    // 1. Prevent self chat
    if (userId === otherUserId) {
        throw new Error("Cannot create a direct chat with yourself");
    }

    if (!isValidUUID(otherUserId)) {
        throw new Error("Invalid otherUserId format");
    }

    // 2. Validate otherUser exists
    const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
    });

    if (!otherUser) {
        throw new Error("Other user does not exist");
    }

    // 3. Find existing DIRECT chat
    // Find all DIRECT chats where the user is a member
    const userDirectChats = await prisma.chat.findMany({
        where: {
            type: "DIRECT",
            members: {
                some: {
                    userId: userId,
                },
            },
        },
        include: {
            members: true,
        },
    });

    // See if any of these chats have exactly 2 members, and the other user is one of them
    const existingChat = userDirectChats.find((chat) => {
        return (
            chat.members.length === 2 &&
            chat.members.some((member) => member.userId === otherUserId)
        );
    });

    // If exists -> return
    if (existingChat) {
        return existingChat;
    }

    // 4. Else: create Chat (DIRECT) and create 2 ChatMember entries
    const newChat = await prisma.chat.create({
        data: {
            type: "DIRECT",
            members: {
                create: [
                    { userId: userId, role: "ADMIN" }, // or MEMBER, role logic not strictly specified for direct
                    { userId: otherUserId, role: "ADMIN" },
                ],
            },
        },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });

    return newChat;
};

export const getUserChats = async (userId: string) => {
    // 1. Find chats where user is member
    const chats = await prisma.chat.findMany({
        where: {
            members: {
                some: {
                    userId: userId,
                },
            },
        },
        // 2. Include members and latest message
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
            messages: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
            },
        },
        // 3. Sort by updatedAt DESC
        orderBy: {
            updatedAt: "desc",
        },
    });

    return chats || []; // Return empty array if no chats
};

export const getChatById = async (chatId: string, userId: string) => {
    // 1. Validate chatId
    if (!isValidUUID(chatId)) {
        throw new Error("Invalid chat ID format");
    }

    // 2. Find chat
    const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });

    if (!chat) {
        throw new Error("Chat not found");
    }

    // 3. Check membership
    const isMember = chat.members.some((member) => member.userId === userId);

    // 4. If not member -> 403 (Service throws specific error to be caught by controller)
    if (!isMember) {
        throw new Error("Forbidden: You are not a member of this chat");
    }

    // 5. Return chat + members
    return chat;
};
