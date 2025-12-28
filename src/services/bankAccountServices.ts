import { initModels } from "../models/init-models";
import { AppError } from "../utils/error";

const BankAccount = initModels().bank_accounts;

export const getAccountsService = async () => {
  const accounts = await BankAccount.findAll();
  if (!accounts) {
    throw new AppError("هیچ اکانت بانکی پیدا نشد", 404);
  }
  return accounts;
};
