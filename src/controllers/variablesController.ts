import { NextFunction, Request, Response } from "express";
import {
  getVariableByName,
  updateCurrencyService,
} from "../services/variablesServices";

export const UpdateCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { newCurrency } = req.body;
    const currency = await updateCurrencyService(newCurrency);
    res.status(200).json({ message: "با موفقیت انجام شد", success: true });
  } catch (error) {
    next(error);
  }
};

export const GetCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currency = await getVariableByName("currency");
    // console.log(currency);
    res.status(200).json({ data: currency.value, success: true });
  } catch (error: any) {
    next(error);
  }
};

export const getDollarToIrrExchange = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dollarIrrRecord = await getVariableByName("usdToIrr");

    res.status(200).json({ data: dollarIrrRecord.value, success: true });
  } catch (error) {
    next(error);
  }
};
