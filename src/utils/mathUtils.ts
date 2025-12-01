export const calculateDiscountPercentagePrice = (
  itemPrice: number,
  discountPercentage: number
) => {
  return itemPrice - (itemPrice * discountPercentage) / 100;
};

export const calculateNewPriceByNewCurrency = (
  oldCurrency: number,
  newCurrency: number,
  currentPrice: number
) => {
  return currentPrice * (newCurrency / oldCurrency);
};

export const calculateDiscountAmount = (price: number, percentage: number) => {
  return (price * percentage) / 100;
};

export const calculateDiscountPercentage = (
  itemPrice: number,
  itemDiscountPrice: number
) => {
  return Math.ceil(((itemPrice - itemDiscountPrice) / itemPrice) * 100);
};

export const calculateIrPriceByCurrency = (
  itemCurrency: number,
  currentCurrency: number
) => {
  return itemCurrency * currentCurrency;
};

export const calculatePercentage = (percentage: number, price: number) =>
  (percentage / 100) * price;

export const getCurrentPrice = (...prices: any[]) => {
  const valid = prices.filter((p) => (typeof p === "number" || +p) && p > 0);
  return valid.length > 0 ? Math.min(...valid) : 0;
};

// export const roundToNearest = (value: number, unit: number = 10000) => {
//   return Math.ceil(value / unit) * unit;
// };
