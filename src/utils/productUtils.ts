import {
  products_variants,
  products_variantsAttributes,
} from "../models/products_variants";
import { calculateDiscountPercentagePrice } from "./mathUtils";

export const modifyDiscountPrice = (
  discount_percentage: number,
  productPrice: number
) => {
  if (discount_percentage == 0) return 0;
  else {
    return calculateDiscountPercentagePrice(productPrice, discount_percentage);
  }
};

export const formatVariants = (
  currency: number,
  variants: products_variants[]
) => {
  return variants.map((singleVariant) => ({
    ...singleVariant.dataValues,
    irrExchange: Math.round(singleVariant.price * currency),
  }));
};
