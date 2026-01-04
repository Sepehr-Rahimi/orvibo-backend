import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { initModels } from "../models/init-models";
import { verifyPhone } from "../utils/verifyPhone";
import {
  changePasswordService,
  getUserProfileService,
  loginService,
  resetPasswordService,
  signupService,
  updateUserService,
  userListService,
  verifyUserInfoService,
  verifyUserService,
} from "../services/userServices";

const User = initModels().users;

const expiresIn = "1d";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await signupService({ ...req.body });

    // Return a success response
    res.status(201).json({
      message: "ثبت نام با موفقیت انجام شد",
      user,
    });
  } catch (err) {
    next(err); // Pass the error to error-handling middleware`
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // console.log(process.env.DB_PASSWORD);

    // Find the user by phone number
    const accessToken = await loginService({ ...req.body });

    res.status(200).json({ message: "ورود با موفقیت انجام شد", accessToken });
  } catch (err) {
    next(err); // Pass the error to the error-handling middleware
  }
};

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userData = await getUserProfileService(req.user);
    res.status(200).json({ user: userData });
    return;
  } catch (err) {
    next(err);
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await updateUserService(req.user, { ...req.body });
    res.status(200).json({
      message: "اطلاعات کاربر با موفقیت ویرایش شد",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await changePasswordService(req.user, { ...req.body });

    res.status(200).json({
      message: "رمز عبور با موفقیت ویرایش شد",
    });
    return;
  } catch (error) {
    next(error);
  }
};
export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await resetPasswordService(req.body);

    res.status(200).json({
      message: "رمز عبور با موفقیت ویرایش شد",
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await verifyUserService(req.body);
    res.status(200).json({
      message: "شماره با موفقیت تایید شد",
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const userList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userListService();

    // Return the list of users in the response
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const verifyUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await verifyUserInfoService(req.body?.phone);
    res
      .status(200)
      .json({ message: "لطفا شماره موبایل خود را تایید کنید", success: true });
  } catch (error) {
    next(error);
  }
};
