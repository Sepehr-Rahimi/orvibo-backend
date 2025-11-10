import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { AuthenticatedRequest } from "../types/requestsTypes";
import { validateDiscount } from "../utils/discountUtil";

const models = initModels();
const DiscountCodes = models.discount_codes;
const Orders = models.orders;

// ایجاد کد تخفیف جدید
export const createDiscountCode = async (req: Request, res: Response) => {
  try {
    const discountCode = await DiscountCodes.create(req.body);
    // console.log(discountCode);
    res.status(201).json({ success: true, data: discountCode });
  } catch (error) {
    console.error("Error creating discount code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// دریافت لیست کدهای تخفیف
export const listDiscountCodes = async (req: Request, res: Response) => {
  try {
    const discountCodes = await DiscountCodes.findAll();
    res.status(200).json({ success: true, data: discountCodes });
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// دریافت اطلاعات یک کد تخفیف بر اساس ID
export const getDiscountCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const discountCode = await DiscountCodes.findByPk(id);
    if (!discountCode) {
      res
        .status(404)
        .json({ success: false, message: "Discount code not found" });
      return;
    }
    res.status(200).json({ success: true, data: discountCode });
  } catch (error) {
    console.error("Error fetching discount code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// به‌روزرسانی یک کد تخفیف
export const updateDiscountCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const discountCode = await DiscountCodes.findByPk(id);
    if (!discountCode) {
      res
        .status(404)
        .json({ success: false, message: "Discount code not found" });
      return;
    }
    await discountCode.update(req.body);
    res
      .status(200)
      .json({ success: true, message: "Discount code updated successfully" });
  } catch (error) {
    console.error("Error updating discount code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// حذف یک کد تخفیف
export const deleteDiscountCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const discountCode = await DiscountCodes.findByPk(id);
    if (!discountCode) {
      res
        .status(404)
        .json({ success: false, message: "Discount code not found" });
      return;
    }
    await discountCode.destroy();
    res
      .status(200)
      .json({ success: true, message: "Discount code deleted successfully" });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const validateDiscountCode = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { code, total_price } = req.body;
    const userId = req?.user?.id;

    if (!code) {
      res
        .status(400)
        .json({ success: false, message: "کد تخفیف وارد نشده است" });
      return;
    }

    const discount = await validateDiscount(code, total_price, userId);
    if (discount.success) {
      res.status(200).json(discount);
    } else {
      res.status(422).json(discount);
    }
  } catch (error) {
    console.error("Error validating discount code:", error);
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
};
