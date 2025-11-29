import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { calculateIrPriceByCurrency, roundToNearest } from "../utils/mathUtils";

const variables = initModels().variables;
const productVariants = initModels().products_variants;
const products = initModels().products;

export const UpdateCurrency = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { newCurrency } = req.body;
  if (!newCurrency) {
    res
      .status(422)
      .json({ message: "لطفا مقدار جدید را وارد کنید", success: false });
    return;
  }

  const transaction = await variables.sequelize?.transaction();
  try {
    const currency = await variables.findOne({
      where: { name: "currency" },
      transaction,
    });
    if (!currency) {
      res
        .status(400)
        .json({ message: "please first enter the currency", success: false });
      return;
    }
    // const oldCurrency = +currency.value;
    // const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();

    const allProductVariants = await productVariants.findAll(
      //   {
      //   // get the products that created before 30 days
      //   where: { created_at: { [Op.lt]: thirtyDaysAgo } },
      // }
      { transaction }
    );

    await Promise.all(
      allProductVariants.map(async (variant) => {
        const variantCurrency = variant?.currency_price;

        // new variantprice based its currency and new difined currency
        const variantNewPrice = variantCurrency
          ? calculateIrPriceByCurrency(variantCurrency, newCurrency)
          : variant.price;

        const priceRatio = variantNewPrice / variant.price;

        const newDiscountPrice = variant.discount_price
          ? roundToNearest(variant.discount_price * priceRatio)
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
    await currency.update({ value: newCurrency }, { transaction });

    await transaction?.commit();
    res.status(200).json({ message: "با موفقیت انجام شد", success: true });
  } catch (error) {
    await transaction?.rollback();
    res.status(500).json({ message: error, success: false });
    console.log(error);
  }
};

export const GetCurrency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currency = await variables.findOne({ where: { name: "currency" } });

    if (!currency || !currency.value) {
      res.status(404).json({ message: "currency not found", success: false });
      return;
    }

    // console.log(currency);
    res.status(200).json({ data: currency, success: true });
  } catch (error: any) {
    console.log(error);
    const errormessage = error?.message?.name || error?.message || error;

    res.status(500).json({ message: errormessage, success: false });
  }
};

export const getDollarToIrrExchange = async (req: Request, res: Response) => {
  try {
    const dollarIrrRecord = await variables.findOne({
      where: { name: "usdToIrr" },
    });

    if (!dollarIrrRecord) {
      res
        .status(404)
        .json({ message: "cannot find the record", success: false });
      return;
    }

    res.status(200).json({ data: dollarIrrRecord.value, success: true });
  } catch (error) {
    res.status(500).json({ message: "server error", success: false });
    console.log(error);
  }
};
