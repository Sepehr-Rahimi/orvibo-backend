import express from "express";
import {
  changePassword,
  getUserProfile,
  login,
  signup,
  updateUserProfile,
} from "../controllers/userController";
import validateRequest from "../middleware/validateRequest";
import {
  userSignupSchema,
  userLoginSchema,
  userUpdateProfileSchema,
  userChangePasswordSchema,
  sendVerificationCodeSchema,
} from "../utils/validate";
import { authenticateToken } from "../middleware/authMiddleware";
import { sendVerificationCode } from "../controllers/verificationCodes";

const router = express.Router();

router.post(
  "/send_verification_code",
  validateRequest(sendVerificationCodeSchema),
  sendVerificationCode
);

export default router;
