import { Request, Response, NextFunction } from "express";
import { sendVerificationCodeService } from "../services/verificationCodeServices";

export const sendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await sendVerificationCodeService(req.body.phone_or_email);
    res.status(200).json({ message: `کد تایید ارسال شد` });
  } catch (error) {
    next(error);
  }
};
