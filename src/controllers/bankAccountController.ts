import { Request, Response } from "express";
import { initModels } from "../models/init-models";

const bankAccounts = initModels().bank_accounts;

export const getAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const account = await bankAccounts.findAll();
    if (!account) {
      res
        .status(404)
        .json({ message: "bank account not fount", success: false });
      return;
    }

    res.status(200).json({ account, success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error", success: false });
    return;
  }
};
