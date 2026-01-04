import { initModels } from "../models/init-models";
import { AppError } from "../utils/error";
import { calculateIrPriceByCurrency } from "../utils/mathUtils";

const Variables = initModels().variables;
const ProductVariants = initModels().products_variants;

export const updateCurrencyService = async (newCurrency: number) => {
  if (!newCurrency) {
    throw new AppError("لطفا مقدار جدید را وارد کنید", 400);
  }

  const transaction = await Variables.sequelize?.transaction();
  try {
    const currency = await Variables.findOne({
      where: { name: "currency" },
      transaction,
    });
    if (!currency) {
      throw new AppError("ارز پیدا نشد", 404);
    }
    // const oldCurrency = +currency.value;
    // const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();

    const allProductVariants = await ProductVariants.findAll(
      //   {
      //   // get the products that created before 30 days
      //   where: { created_at: { [Op.lt]: thirtyDaysAgo } },
      // }
      { transaction }
    );

    await Promise.all(
      allProductVariants.map(async (variant) => {
        const variantCurrency = variant.currency_price;

        // new variantprice based its currency and new difined currency
        const variantNewPrice = calculateIrPriceByCurrency(
          variantCurrency,
          newCurrency
        );

        const priceRatio = variantNewPrice / variant.price;

        const newDiscountPrice = variant.discount_price
          ? variant.discount_price * priceRatio
          : undefined;

        await variant.update(
          {
            price: variantNewPrice,
            discount_price: newDiscountPrice || 0,
          },
          { transaction }
        );
      })
    );
    await currency.update({ value: newCurrency.toString() }, { transaction });

    await transaction?.commit();
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
};

export const getVariableByName = async (name: string) => {
  const variable = await Variables.findOne({ where: { name } });
  if (!variable) throw new AppError(`${name} is not exist in variables`, 404);
  return variable;
};
