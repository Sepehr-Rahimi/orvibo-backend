import { NextFunction, Request, Response } from "express";
import { getAccountsService } from "../services/bankAccountServices";

export const getAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accounts = await getAccountsService();

    res.status(200).json({ account: accounts, success: true });
  } catch (error) {
    next(error);
  }
};
