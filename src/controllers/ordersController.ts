import { Request, Response } from "express";
import {
  addresses,
  addressesAttributes,
  initModels,
  order_items,
  order_itemsAttributes,
  orders,
  products,
} from "../models/init-models";
import { AuthenticatedRequest } from "../types/requestsTypes";
import { formatedFileUrl } from "../utils/fileUtils";
import {
  paymentUrl,
  RequestPayment,
  RequestVerifyPayment,
  zarinpalErrorMessages,
} from "../utils/paymentUtils";
import { useDiscountCode, validateDiscount } from "../utils/discountUtil";
import { sendFactorSmsOrder, sendSmsSuccessOrder } from "../utils/smsUtils";
import {
  calculateCurrencyByIrrPrice,
  calculateIrPriceByCurrency,
  calculatePercentage,
  getCurrentPrice,
} from "../utils/mathUtils";
import puppeteer from "puppeteer";
import fs from "fs";
import sequelize from "../config/database";

// type_of_payment === 1 : payment with bankaccount via zarinpal
// type_of_payment === 0 : siteAdmin create factor

// servicesCost : 15% of itemsCost
// guaranteeCost : 5% of itemsCost
// businessProfit : 10% of itemsCost

interface OrderItemsWithProduct extends order_items {
  product: products;
}

interface OrdersWithOrderItems extends orders {
  order_items: OrderItemsWithProduct[];
}

interface orderWithAddressAndItems extends orders {
  order_items: order_items[];
  address: addresses;
}

type BaseIrrMode = { mode: "manual"; value: number } | { mode: "stored" };
type CreateOrderIrrMode = BaseIrrMode;
type UpdateOrderIrrMode = BaseIrrMode | { mode: "current" };

const models = initModels();
const Orders = models.orders;
const OrderItems = models.order_items;
const Address = models.addresses;
const Product = models.products;
const users = models.users;
const ProductVariants = models.products_variants;
const variables = models.variables;

const defaultGuaranteePercentage = 5;
const defaultServicesPercentage = 9;
const defaultBusinessProfitPercentage = 10;
const defaultShippingCostPercentage = 40;

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: user_id, phone_number } = req.user;

    const {
      address_id,
      // total_cost,
      discount_code,
      // discount_amount,
      // delivery_cost,
      type_of_delivery,
      type_of_payment,
      items,
      services: predeterminedServicesCost,
      guarantee: predeterminedGuaranteeCost,
      businessProfit: predeterminedBusinessProfitCost,
      shipping: predeterminedShipping,
    } = req.body;

    const t = await Orders.sequelize?.transaction();

    const dollarToIrrRecord = await variables.findOne({
      where: { name: "usdToIrr" },
    });

    if (!dollarToIrrRecord) {
      res
        .status(404)
        .json({ message: "cant find the currency record", success: false });
      return;
    }

    let total_cost: number = 0;
    let discount_amount: number = 0;
    let delivery_cost: number = 0;
    let description: string = "";

    let itemsCost = items?.reduce(
      (
        total: number,
        item: { price: number; discount_price: number; quantity: number }
      ) => {
        const price = getCurrentPrice(item.price, item.discount_price);
        return total + item.quantity * price;
      },
      0
    );

    // console.log(itemsCost);

    let servicesCost = 0;
    if (predeterminedServicesCost && predeterminedServicesCost > 0) {
      servicesCost = calculatePercentage(defaultServicesPercentage, itemsCost);
      // console.log(servicesCost);
      // console.log(predeterminedServicesCost);
      if (predeterminedServicesCost !== servicesCost) {
        res
          .status(422)
          .json({ message: "services cost dosent right", success: false });
        return;
      }
    }

    let guaranteeCost = 0;
    if (predeterminedGuaranteeCost && predeterminedGuaranteeCost > 0) {
      guaranteeCost = calculatePercentage(
        defaultGuaranteePercentage,
        itemsCost
      );
      if (predeterminedGuaranteeCost !== guaranteeCost) {
        res
          .status(422)
          .json({ message: "guarantee cost dosent right", success: false });
        return;
      }
    }

    const businessProfit = calculatePercentage(
      defaultBusinessProfitPercentage,
      itemsCost
    );
    const shipping = calculatePercentage(
      defaultShippingCostPercentage,
      itemsCost
    );

    if (
      businessProfit !== predeterminedBusinessProfitCost
      // predeterminedShipping !== shipping
    ) {
      res.status(422).json({
        message: "business profit amount dosent fit by its predetermited",
      });
      return;
    }

    for (const item of items) {
      console.log(item);
      const itemVariant = await ProductVariants.findByPk(item.variant_id);
      if (!itemVariant) {
        res.status(404).json({ message: "محصول با مشخصات مورد نظر پیدا نشد" });
        return;
      }
      if (itemVariant && itemVariant?.stock) {
        const newProdDescription = `${itemVariant.product_id} : ${item.quantity} \n`;
        description = description + newProdDescription;

        if (item.quantity > itemVariant.stock) {
          res.status(422).json({
            success: false,
            message: "متاسفانه محصول مورد نظر به مقدار تعیین شده موجود نیست.",
          });
          return;
        }
      }
    }

    // console.log(description);

    if (discount_code) {
      const discountValidate = await validateDiscount(
        discount_code,
        total_cost,
        user_id
      );
      // console.log(discountValidate);
      if (discountValidate.success && discountValidate?.discount_amount) {
        discount_amount = discountValidate.discount_amount;
        itemsCost = itemsCost - discount_amount;
        // increase the time of the discountcode that used
        await useDiscountCode(discount_code);
      } else {
        res.status(422).json(discountValidate);
      }
    }

    total_cost =
      itemsCost + guaranteeCost + servicesCost + businessProfit + shipping;

    const currency = +dollarToIrrRecord.value;
    const irrPrice = Math.round(
      calculateIrPriceByCurrency(total_cost, currency)
    );

    // if irr price more than 200m toman
    const haveGateWayLimitation = irrPrice > 200000000;

    // const date = new Date();
    const newOrder = await Orders.create(
      {
        user_id,
        address_id,
        total_cost,
        irr_total_cost: irrPrice,
        discount_code,
        discount_amount,
        delivery_cost,
        type_of_delivery,
        status: "1",
        type_of_payment,
        service_cost: servicesCost,
        guarantee_cost: guaranteeCost,
        business_profit: businessProfit,
        shipping_cost: shipping,
        // id: date.getTime(),
      },
      { transaction: t }
    );

    if (items && items.length > 0) {
      const orderItems = items.map((item: order_itemsAttributes) => ({
        ...item,
        order_id: newOrder.id,
      }));
      await OrderItems.bulkCreate(orderItems, { transaction: t });
    }

    if (
      type_of_payment == 1 &&
      !(req.body?.callback_url || req.body?.description)
    ) {
      await t?.rollback();
      res.status(400).json({
        success: false,
        message: "Provide callback url and description for payment",
      });
      return;
    }
    if (
      type_of_payment == 1 &&
      req.body?.callback_url &&
      req.body?.description &&
      !haveGateWayLimitation
    ) {
      const paymentRequestResult = await RequestPayment({
        amount: irrPrice,
        callback_url: req.body?.callback_url,
        description,
        mobile: phone_number,
        order_id: newOrder.id.toString(),
      });

      if (paymentRequestResult.data && paymentRequestResult.data.code == 100) {
        const authority = paymentRequestResult.data.authority;
        const redirectUrl = `${paymentUrl}pg/StartPay/${authority}`;
        await newOrder.update(
          { payment_authority: authority },
          { transaction: t }
        );
        await t?.commit();
        res.json({
          success: true,
          message: "Order created successfully",
          order: newOrder,
          paymentUrl: redirectUrl,
        });
        // console.log(newOrder);
        return;
      } else {
        await t?.rollback();
        res.status(400).json({
          success: false,
          payment_message: paymentRequestResult?.message,
          message: "خطایی رخ داد!",
        });

        // console.log(total_cost + " : total");

        return;
      }
    } else if (type_of_payment == 1 && haveGateWayLimitation) {
      await t?.commit();

      res.json({
        success: true,
        message: "Order created successfully",
        // order: newOrder,
        paymentUrl: `/products/checkout/finalize-order-payment?orderId=${newOrder.id}`,
      });
      return;
    } else if (type_of_payment == 0) {
      await t?.commit();

      res.json({
        success: true,
        message: "Order created successfully",
        paymentUrl: `/dashboard/order/${newOrder.id}`,
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const adminCreateOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: user_id, phone_number } = req.user;

    const {
      address_id,
      // total_cost,
      // discount_code,
      discount_amount,
      // delivery_cost,
      irr_calculate_mode,
      type_of_delivery,
      type_of_payment,
      servicesPercentage,
      guaranteePercentage,
      businessProfitPercentage,
      shippingPercentage,
      items,
    } = req.body;

    const t = await Orders.sequelize?.transaction();

    let total_cost: number = 0;
    let items_cost: number = 0;
    // let discount_amount: number = 0;
    let delivery_cost: number = 0;
    let description: string = "";

    for (const item of items) {
      // console.log(item, "item ");
      const itemVariant = await ProductVariants.findByPk(item.variant_id);
      // console.log(product, "product");
      if (itemVariant && itemVariant?.stock) {
        if (item.quantity > itemVariant.stock) {
          res.status(422).json({
            success: false,
            message: "متاسفانه محصول مورد نظر به مقدار تعیین شده موجود نیست.",
          });
          return;
        }
        const newProdDescription = `${itemVariant.product_id} : ${item.quantity} \n`;
        description = description + newProdDescription;

        const itemPrice: number = item?.discount_price || item.price;
        items_cost += itemPrice * item.quantity;
      }
    }

    const businessProfitCost = +calculatePercentage(
      businessProfitPercentage,
      items_cost
    ).toFixed(2);
    const shippingCost = +calculatePercentage(
      shippingPercentage,
      items_cost
    ).toFixed(2);
    const guaranteeCost = +calculatePercentage(
      guaranteePercentage,
      items_cost
    ).toFixed(2);
    const servicesCost = +calculatePercentage(
      servicesPercentage,
      items_cost
    ).toFixed(2);

    if (discount_amount && discount_amount > 0) {
      items_cost = items_cost - discount_amount;
    }

    total_cost =
      items_cost +
      businessProfitCost +
      shippingCost +
      guaranteeCost +
      servicesCost;
    // console.log(description);

    let orderIrrCurrency = 0;
    if (irr_calculate_mode.mode === "manual") {
      if (!irr_calculate_mode.value || irr_calculate_mode.value <= 0) {
        res
          .status(400)
          .json({ message: "please enter valid currency", success: false });
        return;
      }
      orderIrrCurrency = irr_calculate_mode.value;
    } else {
      const dollarExchangeRecord = await variables.findOne({
        where: { name: "usdToIrr" },
      });

      if (!dollarExchangeRecord) {
        res.status(404).json({ success: false, message: "cant find currency" });
        await t?.rollback();
        return;
      }

      orderIrrCurrency = +dollarExchangeRecord.value;
    }

    // const irrCurrency = +dollarExchangeRecord.value;
    const irr_total_cost = Math.round(
      calculateIrPriceByCurrency(total_cost, orderIrrCurrency)
    );

    // if (discount_code) {
    //   const discountValidate = await validateDiscount(
    //     discount_code,
    //     total_cost,
    //     user_id
    //   );
    //   // console.log(discountValidate);
    //   if (discountValidate.success && discountValidate?.discount_amount) {
    //     discount_amount = discountValidate.discount_amount;
    //     total_cost = total_cost - discount_amount;
    //   } else {
    //     res.status(422).json(discountValidate);
    //   }
    // }

    // console.log(total_cost);

    // const date = new Date();
    const newOrder = await Orders.create(
      {
        user_id,
        address_id,
        total_cost,
        business_profit: businessProfitCost,
        guarantee_cost: guaranteeCost,
        service_cost: servicesCost,
        shipping_cost: shippingCost,
        irr_total_cost: irr_total_cost,
        discount_amount,
        delivery_cost,
        type_of_delivery,
        status: "1",
        type_of_payment,
        // id: date.getTime(),
      },
      { transaction: t }
    );

    if (items && items.length > 0) {
      const orderItems = items.map((item: order_itemsAttributes) => ({
        ...item,
        order_id: newOrder.id,
      }));
      await OrderItems.bulkCreate(orderItems, { transaction: t });
    }

    // if (discount_code) {
    //   const dc = await discountCodes.findOne({
    //     where: {
    //       code: discount_code,
    //     },
    //     transaction: t,
    //   });
    //   dc?.increment("used_count");
    // }

    const addressInfo = await Address.findByPk(newOrder.address_id, {
      transaction: t,
    });

    if (addressInfo) {
      await sendFactorSmsOrder(
        addressInfo.phone_number,
        addressInfo.full_name,
        newOrder.id
        // verifyResult.ref_id
      );
    }

    if (
      type_of_payment == 1 &&
      !(req.body?.callback_url || req.body?.description)
    ) {
      await t?.rollback();
      res.status(400).json({
        success: false,
        message: "Provide callback url and description for payment",
      });
      return;
    }
    if (
      type_of_payment == 1 &&
      req.body?.callback_url &&
      req.body?.description
    ) {
      const paymentRequestResult = await RequestPayment({
        amount: total_cost,
        callback_url: req.body?.callback_url,
        description,
        mobile: phone_number,
        order_id: newOrder.id.toString(),
      });

      if (paymentRequestResult.data && paymentRequestResult.data.code === 100) {
        const authority = paymentRequestResult.data.authority;
        const redirectUrl = `${paymentUrl}pg/StartPay/${authority}`;
        await newOrder.update(
          { payment_authority: authority },
          { transaction: t }
        );
        await t?.commit();
        res.json({
          success: true,
          message: "Order created successfully",
          order: newOrder,
          paymentUrl: redirectUrl,
        });
        // console.log(newOrder);
        return;
      } else {
        await t?.rollback();
        res.status(400).json({
          success: false,
          payment_message: paymentRequestResult?.message,
          message: "خطایی رخ داد!",
        });

        // console.log(total_cost + " : total");

        return;
      }
    } else {
      await t?.commit();

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: newOrder,
      });
      return;
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const finalizeUserOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id: orderId } = req.body;
  const { id: user_id, phone_number } = req.user;
  console.log(orderId);
  console.log(req.body);

  if (!user_id || !phone_number || !orderId) {
    res
      .status(400)
      .json({ message: "لطفا تمام اطلاعات را وارد کنید", success: false });
    return;
  }

  try {
    const transaction = await Orders.sequelize?.transaction();
    const userOrder = await Orders.findByPk(orderId, {
      transaction,
    });
    if (!userOrder) {
      res.status(404).json({ message: "سفارش شما پیدا نشد", success: false });
      return;
    }

    if (userOrder.user_id !== user_id) {
      res.status(401).json({ message: "access denied", success: false });
      return;
    }

    const { irr_total_cost } = userOrder;

    const haveGateWayLimitation = irr_total_cost > 200000000;

    const description = `سفارش ${userOrder.id} پرداخت شد`;

    if (!haveGateWayLimitation) {
      const paymentRequestResult = await RequestPayment({
        amount: irr_total_cost,
        callback_url: req.body?.callback_url,
        description,
        mobile: phone_number,
        order_id: userOrder.id.toString(),
      });

      if (paymentRequestResult.data && paymentRequestResult.data.code == 100) {
        const authority = paymentRequestResult.data.authority;
        const redirectUrl = `${paymentUrl}pg/StartPay/${authority}`;
        await userOrder.update(
          {
            payment_authority: authority,
            type_of_payment: "1",
            // payment_status: 1,
          },
          { transaction }
        );
        await transaction?.commit();
        res.json({
          success: true,
          message: "Order created successfully",
          order: userOrder,
          paymentUrl: redirectUrl,
        });
        // console.log(newOrder);
        return;
      } else {
        await transaction?.rollback();
        res.status(400).json({
          success: false,
          payment_message: paymentRequestResult?.message,
          message: "خطایی رخ داد!",
        });
        return;
      }
    } else {
      await transaction?.commit();

      res.json({
        success: true,
        message: "Order created successfully",
        // order: newOrder,
        paymentUrl: `/products/checkout/finalize-order-payment?orderId=${userOrder.id}`,
      });
      return;
    }
  } catch (error) {
    res.status(500).json({ message: "server error", success: false });
    console.log(error);
  }
};

export const listOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user_id = req?.user?.id;

  interface OrdersWithTotalOrderItems extends orders {
    order_items: order_items[];
  }

  try {
    const orders: OrdersWithTotalOrderItems[] = await Orders.findAll({
      where: {
        user_id,
      },
      include: [{ model: OrderItems, as: "order_items" }],
    });

    const ordersWithTotalQuantity = orders.map((order) => {
      const total_quantity = order.order_items
        ? order.order_items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      return {
        ...order.dataValues,
        total_quantity,
      };
    });

    res.status(200).json({ success: true, data: ordersWithTotalQuantity });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const listOrdersAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // const user_id = req?.user?.id;

  interface OrdersWithTotalOrderItems extends orders {
    order_items: order_items[];
  }

  try {
    const orders: OrdersWithTotalOrderItems[] = await Orders.findAll({
      // where: {
      //   user_id,
      // },
      order: [
        [
          // params?.sort?.toString() ||
          "created_at",
          // params?.order?.toString() ||
          "DESC",
        ],
      ],
      include: [
        { model: OrderItems, as: "order_items" },
        { model: users, as: "user" },
        { model: Address, as: "address" },
      ],
    });

    const ordersWithTotalQuantity = orders.map((order) => {
      const total_quantity = order.order_items
        ? order.order_items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      return {
        ...order.dataValues,
        total_quantity,
      };
    });

    res.status(200).json({ success: true, data: ordersWithTotalQuantity });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const { includeProductVariants = false } = req.query;

  try {
    const order: OrdersWithOrderItems | null = await Orders.findByPk(id, {
      include: [
        {
          model: OrderItems,
          as: "order_items",
          include: [
            {
              model: Product,
              as: "product",
              include: includeProductVariants
                ? [{ model: ProductVariants, separate: true, as: "variants" }]
                : [],
            },
            { model: ProductVariants, as: "variant" },
          ],
        },
        { model: Address, as: "address" },
        { model: users, as: "user" },
      ],
      order: [
        // Order order_items by product.name
        [
          { model: OrderItems, as: "order_items" },
          { model: Product, as: "product" },
          "name",
          "ASC",
        ],
        [
          { model: OrderItems, as: "order_items" },
          { model: ProductVariants, as: "variant" },
          "color",
          "ASC",
        ],
        [
          { model: OrderItems, as: "order_items" },
          { model: ProductVariants, as: "variant" },
          "kind",
          "ASC",
        ],
      ],
    });

    if (!order) {
      res.status(400).json({ success: false, message: "Order not found" });
      return;
    }
    if (order.user_id !== req?.user?.id && req?.user?.role !== 2) {
      res.status(403).json({ success: false, message: "No access" });
      return;
    }

    if (order.order_items) {
      const modifiedOrder = {
        ...order.dataValues,
        products_cost: order?.order_items.reduce(
          (cost: number = 0, item) =>
            cost +
            getCurrentPrice(item.price, item.discount_price) * item.quantity,
          0
        ),
        order_items: order?.order_items.map((item) => ({
          ...item.dataValues,
          product: {
            ...item.product.dataValues,
            images: item?.product?.images?.map((image) =>
              formatedFileUrl(image)
            ), // Example change
          },
        })),
      };
      res.status(200).json({ success: true, order: modifiedOrder });
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const {
    address_id,
    // update_irr,
    irr_calculate_mode,
    discount_amount,
    delivery_cost,
    type_of_delivery,
    type_of_payment,
    status,
    payment_status,
    servicesPercentage,
    guaranteePercentage,
    businessProfitPercentage,
    shippingPercentage,
    items,
  } = req.body;

  const transaction = await Orders.sequelize?.transaction();

  try {
    const order = await Orders.findByPk(id, {
      transaction,
      include: { model: order_items, as: "order_items" },
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      await transaction?.rollback();
      return;
    }

    // handle product/variants stock based order status

    if (status && order.status !== status && order.type_of_payment != "1") {
      const unblockedTransitions: Record<string, string[]> = {
        "1": ["2", "3"],
        "2": ["4"],
        "3": ["1"],
        "4": ["1"],
      };
      if (!unblockedTransitions[order.status]?.includes(status)) {
        res.status(422).json({
          message: "please enter valid status for order",
          success: false,
        });
        return;
      }
      const orderItems = await order_items.findAll({
        where: { order_id: order.id },
      });
      await Promise.all(
        orderItems.map(async (orderItem) => {
          const itemVariant = await ProductVariants.findByPk(
            orderItem.variant_id
          );
          if (!itemVariant) {
            res
              .status(404)
              .json({ message: "cannot find the variant", success: false });
            return;
          }
          let itemVariantStock = itemVariant.stock;
          if (["4"].includes(status)) {
            itemVariantStock = itemVariantStock + orderItem.quantity;
          } else if (["2"].includes(status)) {
            if (itemVariantStock <= 0) {
              res.status(422).json({ message: "out of stock", success: false });
              return;
            }
            itemVariantStock = Math.max(
              itemVariantStock - orderItem.quantity,
              0
            );
          }
          itemVariant.update({ stock: itemVariantStock });
        })
      );
    }

    // handle irrcurrency for order irr_total_cost
    let orderIrrCurrencyPrice = calculateCurrencyByIrrPrice(
      order.irr_total_cost,
      order.total_cost
    );

    const total_cost = order.total_cost;
    const items_cost = order.order_items.reduce(
      (cost, item) =>
        (cost +=
          getCurrentPrice(item.price, item.discount_price) * item.quantity),
      0
    );

    let new_items_cost = items?.length > 0 ? 0 : items_cost;
    let new_total_cost = items && items.length > 0 ? 0 : total_cost;

    let businessProfitCost = order.business_profit;
    let shippingCost = order.shipping_cost;
    let guaranteeCost = order.guarantee_cost;
    let servicesCost = order.service_cost;

    let irrTotalCost = Math.round(
      calculateIrPriceByCurrency(total_cost, +orderIrrCurrencyPrice)
    );

    if (
      items?.length ||
      discount_amount ||
      businessProfitPercentage ||
      shippingPercentage ||
      servicesPercentage ||
      guaranteePercentage ||
      irr_calculate_mode
    ) {
      if (irr_calculate_mode) {
        const irrCalculateMode: UpdateOrderIrrMode = irr_calculate_mode;
        if (irrCalculateMode.mode === "current") {
          orderIrrCurrencyPrice = Math.round(
            order.irr_total_cost / order.total_cost
          );
        } else if (irrCalculateMode.mode === "manual") {
          if (!irrCalculateMode.value || irrCalculateMode.value <= 0) {
            res.status(400).json({
              message: "please enter valid currency for irr cost",
              success: false,
            });
            return;
          }
          orderIrrCurrencyPrice = irrCalculateMode.value;
        } else {
          const dollarToIrrRecord = await variables.findOne({
            where: { name: "usdToIrr" },
          });
          if (!dollarToIrrRecord) {
            res.status(404).json({
              message: "cant find irr exchange record",
              success: false,
            });
            return;
          }
          orderIrrCurrencyPrice = +dollarToIrrRecord.value;
        }
      }
      if (items) {
        for (const item of items) {
          // console.log(item, "item ");
          const itemVariant = await ProductVariants.findByPk(item.variant_id);
          // console.log(product, "product");
          if (itemVariant && itemVariant?.stock) {
            if (item.quantity > itemVariant.stock) {
              res.status(422).json({
                success: false,
                message:
                  "متاسفانه محصول مورد نظر به مقدار تعیین شده موجود نیست.",
              });
              await transaction?.rollback();
              return;
            }

            const itemPrice: number = getCurrentPrice(
              item.price,
              item.discount_price
            );
            new_items_cost += itemPrice * item.quantity;
          }
        }
      }

      if (discount_amount && discount_amount > 0) {
        new_total_cost = new_items_cost - discount_amount;
      } else new_total_cost = new_items_cost;

      if (
        guaranteePercentage ||
        businessProfitPercentage ||
        shippingPercentage ||
        servicesPercentage
      ) {
        businessProfitCost = calculatePercentage(
          businessProfitPercentage,
          new_items_cost
        );
        shippingCost = calculatePercentage(shippingPercentage, new_items_cost);
        guaranteeCost = calculatePercentage(
          guaranteePercentage,
          new_items_cost
        );
        servicesCost = calculatePercentage(servicesPercentage, new_items_cost);
      }

      new_total_cost +=
        businessProfitCost + shippingCost + guaranteeCost + servicesCost;

      irrTotalCost = Math.round(
        calculateIrPriceByCurrency(new_total_cost, +orderIrrCurrencyPrice)
      );
    }

    await order.update({
      address_id,
      total_cost: new_total_cost,
      business_profit: businessProfitCost,
      service_cost: servicesCost,
      guarantee_cost: guaranteeCost,
      shipping_cost: shippingCost,
      irr_total_cost: irrTotalCost,
      discount_amount,
      delivery_cost,
      type_of_delivery,
      type_of_payment,
      status,
      payment_status,
    });

    if (items) {
      // await OrderItems.destroy({ where: { order_id: id } });
      // const orderItems = items.map((item: any) => ({
      //   ...item,
      //   order_id: id,
      // }));
      // await OrderItems.bulkCreate(orderItems);
      const existingOrderItems = await order_items.findAll({
        where: { order_id: id },
        transaction,
      });
      const existingItemsMap = new Map<number, any>();
      existingOrderItems.map((singleItem) =>
        existingItemsMap.set(singleItem.dataValues.id, singleItem.dataValues)
      );

      const itemsToCreate: order_itemsAttributes[] = [];
      const itemsToUpdate: order_itemsAttributes[] = [];
      const incomingExistingIds = new Set<number>();

      for (const item of items) {
        if (item.id && existingItemsMap.has(item.id)) {
          itemsToUpdate.push({ ...item, order_id: id });
          incomingExistingIds.add(item.id);
        } else {
          itemsToCreate.push({ ...item, order_id: id });
        }
      }

      const itemsToDelete = existingOrderItems
        .filter(
          (singleItem) => !incomingExistingIds.has(singleItem.dataValues.id)
        )
        .map((singleItem) => singleItem.dataValues.id);

      if (itemsToDelete.length) {
        await OrderItems.destroy({
          where: { id: itemsToDelete },
          transaction,
        });
      }

      for (const item of itemsToUpdate) {
        await OrderItems.update(item, {
          where: { id: item.id },
          transaction,
        });
      }

      if (itemsToCreate.length) {
        await OrderItems.bulkCreate(itemsToCreate, { transaction });
      }
    }
    transaction?.commit();
    res
      .status(200)
      .json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    await transaction?.rollback();
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  // const { restore } = req.body;
  console.log(req.body);

  try {
    const order = await Orders.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // if (restore) {
    //   const orderItems = await order_items.findAll({
    //     where: { order_id: order.id },
    //   });
    //   Promise.all(
    //     orderItems.map(async (orderItem: order_itemsAttributes) => {
    //       const product = await Product.findByPk(orderItem.product_id);
    //       if (!product) {
    //         res.status(404).json({
    //           message: "cant find the target product",
    //           success: false,
    //         });
    //         return;
    //       }
    //       const newStock = product.stock + orderItem.quantity;
    //       await product.update({ stock: newStock });
    //     })
    //   );
    // }

    await OrderItems.destroy({ where: { order_id: id } });
    await order.destroy();

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { authority } = req.body;

  const order: orderWithAddressAndItems | null = await orders.findOne({
    where: { payment_authority: authority },
    include: [
      { model: OrderItems, as: "order_items" },
      { model: Address, as: "address" },
    ],
  });
  if (!order || !order.order_items) {
    res.status(401).json({ message: "سفارش پیدا نشد", success: false });
    return;
  }
  const amount = order?.irr_total_cost;
  // console.log("here");
  // console.log(order);
  // console.log(authority);
  // console.log(amount);

  if (!authority || !amount) {
    res
      .status(400)
      .json({ success: false, message: "the authority and amount is require" });
    return;
  }

  try {
    const data = await RequestVerifyPayment({ authority, amount });
    const verifyResult = data?.data || data;

    // console.log(data, " : data");
    // console.log(verifyResult, " : verify");
    const items = order.order_items;
    // console.log(items, ":items");

    if (verifyResult.code === 100 || verifyResult.code === 101) {
      for (const item of items) {
        const itemVariant = await ProductVariants.findByPk(item.variant_id);
        if (
          itemVariant &&
          itemVariant.stock &&
          order.payment_status == 0 &&
          order.type_of_payment == "1"
          // order.type_of_delivery == "1"
        ) {
          // const newStock = Math.max(itemVariant.stock - item.quantity, 0);
          // await itemVariant.update({ stock: newStock });
        }
      }
      await order.update({ payment_status: 1 });
      const user = await users.findByPk(order.user_id);
      if (order?.address && verifyResult.code === 100) {
        await sendSmsSuccessOrder(
          order.address.phone_number,
          order.address.full_name,
          order.id,
          verifyResult.ref_id
        );
      }
      res.status(200).json({
        success: true,
        message: "پرداخت با موفقیت انجام شد.",
        ref_id: verifyResult.ref_id,
        verifyStatus: "OK",
      });
      return;
    } else {
      const errorMessage =
        zarinpalErrorMessages[verifyResult.code.toString()] ||
        "خطای نامشخصی رخ داده است.";
      res.status(400).json({
        success: false,
        message: errorMessage,
        code: verifyResult?.code,
        verifyStatus: "NOK",
      });
      return;
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: error || "somthing went wrong", success: false });
    console.error("Error verifying payment:", error);
    return;
  }
};

export const createOrderPdf = async (req: Request, res: Response) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(" ")[1];
  const { bank: choosedAccount, lang, isAdmin, withoutPricing } = req.query;

  // console.log("choosed account is :", choosedAccount);

  if (!token) {
    res.status(401).json({ message: "Unauthorized", success: false });
    return;
  }
  if (!id) {
    res.status(400).json({ message: "Order ID required" });
    return;
  }

  const ifisAdmin = isAdmin == "true" ? "/admin/" : "";
  const ifIsEn = lang == "en" ? "en" : "/";
  const pdfUrl = `${process.env.APP_URL}${ifisAdmin}dashboard/order/${id}/${ifIsEn}?pdf=1&bank=${choosedAccount}&withoutPricing=${withoutPricing}`;

  // console.log(pdfUrl);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      waitForInitialPage: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto(new URL(process.env.APP_URL!).origin, {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(
      (tokenValue) => localStorage.setItem("jwt_access_token", tokenValue),
      token
    );

    await page.goto(pdfUrl, { waitUntil: "networkidle0", timeout: 60000 });

    //  save debug HTML
    // fs.writeFileSync(`./debug-html-order-${id}.html`, await page.content());

    const pdf = await page.pdf({
      format: "A4",
      waitForFonts: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 20, left: 10, right: 10, bottom: 20 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${id}.pdf`
    );
    res.setHeader("Content-Length", pdf.length);
    res.end(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Server error", success: false });
  } finally {
    if (browser) await browser.close();
  }
};
