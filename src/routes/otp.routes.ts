import express, { Request, Response, Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { OTPService } from "../service/otp.service";
import { User } from "../types/user.type";

const router: Router = express.Router();
const otpService = new OTPService();

router.post(
  "/send-otp",
  asyncHandler(async (req: Request, res: Response) => {
    const userData: User = req.body;
    await otpService.sendOtp(userData);

    res.status(200).json({
      status: "success",
      message: "Check your mail",
    });
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await otpService.verifyOTP(email, otp);
    res.status(200).json({ api_key: result.api_key });
  })
);

export default router;
