import express, { Request, Response, Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { userInfo } from "../types/user.type";
import { ChatWithCharacters } from "../service/chat.service";
import { Messages } from "../types/chat.type";
import { RateLimitService } from "../service/ratelimitService";

const router: Router = express.Router();

const chatService = new ChatWithCharacters();
const ratelimitService = new RateLimitService({ freelimit: 50 });

router.post(
  "/characters",
  asyncHandler(async (req: Request, res: Response) => {
    await ratelimitService.checkRateLimit(req.user?.key as string);
    const userInfo: userInfo = req.body;
    const messages: Array<Messages> = req.body.messages;
    const message = await chatService.sendMessage(userInfo, messages);

    res.status(200).json({
      status: "success",
      message,
    });
  })
);

export default router;
