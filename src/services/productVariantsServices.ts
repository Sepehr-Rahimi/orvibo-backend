import { initModels } from "../models/init-models";
import { AppError } from "../utils/error";

const Variants = initModels().products_variants;

export const singleVariantService = async (variantId: number | string) => {
  if (!variantId) throw new AppError("provide product_variant id", 400);
  const productVariant = await Variants.findByPk(variantId);
  if (!productVariant)
    throw new AppError("محصول با مشخصات مورد نظر پیدا نشد", 404);
  return productVariant;
};
