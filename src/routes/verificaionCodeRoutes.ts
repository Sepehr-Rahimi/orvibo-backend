import express from "express";

import validateRequest from "../middleware/validateRequest";
import { sendVerificationCodeSchema } from "../utils/validate";
import { sendVerificationCode } from "../controllers/verificationCodes";

const router = express.Router();

router.post(
  "/send_verification_code",
  validateRequest(sendVerificationCodeSchema),
  sendVerificationCode
);

export default router;
