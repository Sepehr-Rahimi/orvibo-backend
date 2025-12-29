import { discount_codesAttributes, initModels } from "../models/init-models";
import { pick } from "../utils/dataUtils";
import { validateDiscount } from "../utils/discountUtil";
import { AppError } from "../utils/error";

const DiscountCodes = initModels().discount_codes;

export const createDiscountCodeService = async (
  data: discount_codesAttributes
) => {
  const discountCode = await DiscountCodes.create({ ...data });
  return discountCode;
};

export const listDiscountCodesService = async () => {
  const discountCodes = await DiscountCodes.findAll();
  return discountCodes;
};

export const singleDiscountCodeService = async (
  discountId: number | string
) => {
  const discountCode = await DiscountCodes.findByPk(discountId);
  if (!discountCode) {
    throw new AppError("کد تخفیف پیدا نشد", 404);
  }
  return discountCode;
};

export const updateDiscountCodeService = async (
  discountId: number | string,
  data: discount_codesAttributes
) => {
  const discountCode = await DiscountCodes.findByPk(discountId);
  if (!discountCode) {
    throw new AppError("discount code not found", 404);
  }
  await discountCode.update({ ...data });
};

export const deleteDiscountCodeService = async (
  discountId: number | string
) => {
  const discountCode = await DiscountCodes.findByPk(discountId);
  if (!discountCode) {
    throw new AppError("discount not found", 404);
  }
  await discountCode.destroy();
};

export const validateDiscountCodeService = async (data: {
  code: string;
  total_price: number;
  userId: number;
}) => {
  const { code, total_price, userId } = data;

  if (!code) {
    throw new AppError("لطفا کد تخفیف را وارد کنید", 400);
  }

  const discount = await validateDiscount(code, total_price, userId);
  return discount;
};
