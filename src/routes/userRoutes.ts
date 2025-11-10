import express from "express";
import {
  changePassword,
  getUserProfile,
  login,
  resetPassword,
  signup,
  updateUserProfile,
  userList,
  verifyUser,
  verifyUserInfo,
} from "../controllers/userController";
import validateRequest from "../middleware/validateRequest";
import {
  userSignupSchema,
  userLoginSchema,
  userUpdateProfileSchema,
  userChangePasswordSchema,
  userResetPasswordSchema,
  userVerifySchema,
} from "../utils/validate";
import {
  authenticateAdminToken,
  authenticateToken,
} from "../middleware/authMiddleware";
import {
  sendVerificationCode,
  verifyCode,
} from "../controllers/verificationCodes";
import { verifyPhone } from "../utils/verifyPhone";

const router = express.Router();

router.post("/signup", validateRequest(userSignupSchema), signup);

router.post("/login", validateRequest(userLoginSchema), login);

router.get("/me", authenticateToken, getUserProfile);

router.post(
  "/update_profile",
  authenticateToken,
  validateRequest(userUpdateProfileSchema),
  updateUserProfile
);

router.post(
  "/change_password",
  authenticateToken,
  validateRequest(userChangePasswordSchema),
  changePassword
);

router.post(
  "/reset_password",
  validateRequest(userResetPasswordSchema),
  verifyCode,
  resetPassword
);

router.post(
  "/verify_user",
  validateRequest(userVerifySchema),
  verifyCode,
  verifyUser
);

router.post("/verify_signup", verifyUserInfo);

router.get("/users_list", authenticateAdminToken, userList);

export default router;
