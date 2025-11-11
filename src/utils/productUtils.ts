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
