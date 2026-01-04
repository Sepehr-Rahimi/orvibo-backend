import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/requestsTypes";
import {
  createDiscountCodeService,
  deleteDiscountCodeService,
  listDiscountCodesService,
  singleDiscountCodeService,
  updateDiscountCodeService,
  validateDiscountCodeService,
} from "../services/discountCodesServices";

// ایجاد کد تخفیف جدید
export const createDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const discountCode = await createDiscountCodeService({ ...req.body });
    // console.log(discountCode);
    res.status(201).json({ success: true, data: discountCode });
  } catch (error) {
    next(error);
  }
};

// دریافت لیست کدهای تخفیف
export const listDiscountCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const discountCodes = await listDiscountCodesService();
    res.status(200).json({ success: true, data: discountCodes });
  } catch (error) {
    next(error);
  }
};

// دریافت اطلاعات یک کد تخفیف بر اساس ID
export const getDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const discountCode = await singleDiscountCodeService(id);
    res.status(200).json({ success: true, data: discountCode });
  } catch (error) {
    next(error);
  }
};

// به‌روزرسانی یک کد تخفیف
export const updateDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const discount = await updateDiscountCodeService(id, { ...req.body });
    res
      .status(200)
      .json({ success: true, message: "Discount code updated successfully" });
  } catch (error) {
    next(error);
  }
};

// حذف یک کد تخفیف
export const deleteDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const discountCode = await deleteDiscountCodeService(id);
    res
      .status(200)
      .json({ success: true, message: "Discount code deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const validateDiscountCode = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const discount = await validateDiscountCodeService({
      ...req.body,
      userId: req.user.id,
    });
    if (discount.success) {
      res.status(200).json(discount);
    } else {
      res.status(422).json(discount);
    }
  } catch (error) {
    next(error);
  }
};
