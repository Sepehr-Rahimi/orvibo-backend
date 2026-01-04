import {
  products_variants,
  products_variantsAttributes,
} from "../models/products_variants";
import { fileUrlToPath } from "./fileUtils";
import { calculateDiscountPercentagePrice, getCurrentPrice } from "./mathUtils";

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
  return variants
    .filter((singleVariant) => singleVariant.is_published)
    .map((singleVariant) => ({
      ...singleVariant.dataValues,
      irrExchange: Math.round(
        getCurrentPrice([singleVariant.price, singleVariant.discount_price]) *
          currency
      ),
    }));
};

export const orderingProductImages = (
  images: string | string[] | undefined,
  orderImages: string[],
  files: { path: string }[]
) => {
  const urls = Array.isArray(images) ? images : images ? [images] : [];
  const allImages = [];
  let fileIndex = 0;
  let urlIndex = 0;

  if (orderImages && orderImages?.length > 0) {
    for (let i = 0; i < orderImages?.length; i++) {
      const value = orderImages[i];
      if (value == "url") {
        allImages.push(fileUrlToPath(urls[urlIndex]));
        urlIndex++;
      } else {
        // this slot was a file (Multer stripped the original value)
        const file = files[fileIndex];
        file.path.replace(/\\/g, "/");
        allImages.push(file.path);
        fileIndex++;
      }
    }
  }
  return allImages;
};
