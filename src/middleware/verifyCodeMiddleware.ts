import { NextFunction, Request, Response } from "express";
import { verifyCodeService } from "../services/verificationCodeServices";

export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await verifyCodeService(req.body);
    next();
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
