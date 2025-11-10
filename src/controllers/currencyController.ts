import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import dayjs from "dayjs";
import { Op } from "sequelize";

const variables = initModels().variables;
const products = initModels().products;

export const UpdateCurrency = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { newCurrency } = req.body;
  // console.log(newCurrency);
  if (!newCurrency) {
    res
      .status(422)
      .json({ message: "لطفا مقدار جدید را وارد کنید", success: false });
    return;
  }

  try {
    const currency = await variables.findOne({ where: { name: "currency" } });
    if (!currency) {
      res
        .status(400)
        .json({ message: "please first enter the currency", success: false });
      return;
    }
    // const oldCurrency = +currency.value;
    // const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();

    const allProducts = await products
      .findAll
      //   {
      //   // get the products that created before 30 days
      //   where: { created_at: { [Op.lt]: thirtyDaysAgo } },
      // }
      ();

    // console.log(allProducts);
    // console.log(differencePercentage);

    allProducts.map(async (product) => {
      const productCurrency = product?.currency_price;
      // const newPrice =
      //   Math.round((product.price * differencePercentage) / 10000) * 10000;

      const newPrice = productCurrency
        ? Math.round((productCurrency * newCurrency) / 10000) * 10000
        : product.price;
      const differencePercentage = newPrice / product.price;

      const newDiscountPrice = product.discount_price
        ? Math.round((product.discount_price * differencePercentage) / 10000) *
          10000
        : undefined;
      // const newDiscountPrice = product.discount_price  && productCurrency? productCurrency

      // console.log("product price :", product.price);
      // console.log("new price : ", newPrice);
      // console.log("discountPrice : ", product.discount_price);
      // console.log("new discountPrice", newDiscountPrice);
      await product.update({
        price: newPrice,
        discount_price: newDiscountPrice || 0,
      });
    });
    await currency.update({ value: newCurrency });

    res.status(200).json({ message: "با موفقیت انجام شد", success: true });
  } catch (error) {
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
