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
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import {
  sendVerificationCode,
  verifyCode,
} from "../controllers/verificationCodes";
import { verifyPhone } from "../utils/verifyPhone";
import { UserRoles } from "../enums/userRolesEnum";

const router = express.Router();

router.post("/signup", validateRequest(userSignupSchema), signup);

router.post("/login", validateRequest(userLoginSchema), login);

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

router.use(authenticateToken);

router.get("/me", getUserProfile);

router.post(
  "/update_profile",
  validateRequest(userUpdateProfileSchema),
  updateUserProfile
);

router.post(
  "/change_password",
  validateRequest(userChangePasswordSchema),
  changePassword
);

router.post("/verify_signup", verifyUserInfo);

router.use(authorize([UserRoles.Admin]));

router.get("/users_list", userList);

export default router;
