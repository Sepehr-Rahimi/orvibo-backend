import { initModels } from "../models/init-models";
import { calculateDiscountAmount } from "./mathUtils";

interface validateProps {
  code: string;
  userId: number;
  orderCost: number;
}

const discounts = initModels().discount_codes;
const Orders = initModels().orders;

export const validateDiscount = async (
  code: string,
  orderCost: number,
  userId: number
) => {
  try {
    const discount = await discounts.findOne({ where: { code } });

    let discount_amount;
    if (!discount) return { success: false, message: "کدتخفیف پیدا نشد" };
    const now = new Date();
    if (discount.start_date > now || discount.end_date < now) {
      return { success: false, message: "کدتخفیف منقضی شده" };
    }

    // check discount max uses
    if (
      discount.max_uses &&
      discount?.used_count &&
      discount?.used_count >= discount.max_uses
    ) {
      return {
        success: false,
        message: "حداکثر استفاده از این کد تخفیف انجام شده است",
      };
    }

    if (discount.user_specific) {
      const userUsage = await Orders.count({
        where: { user_id: userId, discount_code: discount.code },
      });
      if (userUsage > 0) {
        return {
          success: false,
          message: "از این کد تخفیف استفاده شده است",
        };
      }
    }

    if (
      discount.min_order &&
      discount.min_order > 0 &&
      orderCost < discount.min_order
    ) {
      return {
        success: false,
        message: `برای استفاده از این کد باید حداقل ${discount.min_order} خرید کنید`,
      };
    }

    if (discount.type === "fixed") {
      discount_amount = discount.value;
    } else if (discount.type === "percentage") {
      const calculatedDiscount = calculateDiscountAmount(
        orderCost,
        discount.value
      );
      if (
        discount.max_amount &&
        discount.max_amount > 0 &&
        calculatedDiscount >= discount.max_amount
      ) {
        discount_amount = discount.max_amount;
      } else {
        discount_amount = calculatedDiscount;
      }
    }

    return {
      success: true,
      discount_amount,
    };
  } catch (error) {
    throw error;
  }
};

export const useDiscountCode = async (discountCode: string) => {
  try {
    const discount = await discounts.findOne({ where: { code: discountCode } });
    discount?.increment("used_count");
  } catch (error) {
    console.log("we have an error :", error);
  }
};
