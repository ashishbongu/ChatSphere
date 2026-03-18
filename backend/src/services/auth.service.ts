import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token";

const prisma = new PrismaClient();

// REGISTER
export const registerUser = async (data: {
    email: string;
    password: string;
    name?: string;
}) => {
    const { email, password, name } = data;

    // check existing user
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User already exists");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
    });

    return {
        id: user.id,
        email: user.email,
        name: user.name,
    };
};

// LOGIN
export const loginUser = async (data: {
    email: string;
    password: string;
}) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const token = generateToken(user.id);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
    };
};