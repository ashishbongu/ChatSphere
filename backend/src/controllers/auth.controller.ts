import { Request, Response } from "express";
import * as authService from "../services/auth.service";

// REGISTER
export const register = async (req: Request, res: Response) => {
    try {
        const user = await authService.registerUser(req.body);

        res.status(201).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const data = await authService.loginUser(req.body);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};