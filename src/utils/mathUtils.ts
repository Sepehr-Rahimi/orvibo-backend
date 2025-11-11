export const calculateDiscountPercentagePrice = (
  itemPrice: number,
  discountPercentage: number
) => {
  return roundToNearest(itemPrice - (itemPrice * discountPercentage) / 100);
};

export const calculateNewPriceByNewCurrency = (
  oldCurrency: number,
  newCurrency: number,
  currentPrice: number
) => {
  return roundToNearest(currentPrice * (newCurrency / oldCurrency));
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
  return roundToNearest(itemCurrency * currentCurrency);
};

export const roundToNearest = (value: number, unit: number = 10000) => {
  return Math.ceil(value / unit) * unit;
};
