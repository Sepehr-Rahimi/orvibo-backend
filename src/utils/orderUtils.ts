import { order_itemsAttributes } from "../models/order_items";
import { AppError } from "./error";
import { calculatePercentage, normalizeDecimal } from "./mathUtils";

export const calculateAdditionalOrderCosts = <T extends string>(
  additionalCosts: {
    name: T;
    percentage?: number;
    predetermined?: number;
  }[],
  cost_based: number
) => {
  return additionalCosts.reduce((result, singleCost) => {
    if (singleCost.percentage && singleCost.predetermined !== 0) {
      const calculatedCost = calculatePercentage(
        singleCost.percentage,
        cost_based
      );

      if (
        singleCost.predetermined &&
        singleCost.predetermined !== calculatedCost
      ) {
        throw new AppError(
          `${singleCost.name} does not match the predetermined amount`,
          422
        );
      }
      result[singleCost.name] = calculatedCost;
    } else result[singleCost.name] = 0;
    return result;
  }, {} as Record<T, number>);
};

// export const isOrderItemsChange = (
//   currentItems: order_itemsAttributes[],
//   newITems: order_itemsAttributes[]
// ) => {
//   if (currentItems.length !== newITems.length) return false;

//   return newITems.every((newItem) =>
//     currentItems.some((currentItem) => deepEqual(newItem, currentItem))
//   );

//   function deepEqual(obj1 : order_itemsAttributes, obj2:order_itemsAttributes) {
//     const keys1 = Object.keys(obj1);
//     const keys2 = Object.keys(obj2);

//     if (keys1.length !== keys2.length) return false;

//     return keys1.every((key) => obj1[key] === obj2[key]);
//   }
// };
