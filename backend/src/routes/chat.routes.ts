import express from "express";
import * as chatController from "../controllers/chat.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(protect);

router.post("/direct", chatController.createDirectChat);
router.get("/", chatController.getUserChats);
router.get("/:chatId", chatController.getChat);

export default router;
