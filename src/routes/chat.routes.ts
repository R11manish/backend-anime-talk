import express, { Request, Response, Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { userInfo } from "../types/user.type";
import { ChatWithCharacters } from "../service/chat.service";
import { Messages } from "../types/chat.type";

const router: Router = express.Router();

const chatService = new ChatWithCharacters();

router.post(
  "/characters",
  asyncHandler(async (req: Request, res: Response) => {
    const userInfo: userInfo = req.body;
    const messages: Array<Messages> = req.body.messages;
    const message = await chatService.sendMessage(userInfo, messages);

    res.status(200).json({
      status: "success",
      message,
    });
  })
);
