import {
  addresses,
  addressesAttributes,
  initModels,
  order_items,
  order_itemsAttributes,
  orders,
} from "../models/init-models";
import * as variablesServices from "./variablesServices";
import {
  calculateCurrencyByIrrPrice,
  calculateIrPriceByCurrency,
  calculatePercentage,
  getCurrentPrice,
} from "../utils/mathUtils";
import { AppError } from "../utils/error";
import { calculateAdditionalOrderCosts } from "../utils/orderUtils";
import { useDiscountCode, validateDiscount } from "../utils/discountUtil";
import {
  paymentUrl,
  RequestPayment,
  RequestVerifyPayment,
  zarinpalErrorMessages,
} from "../utils/paymentUtils";
import { OrderCosts } from "../enums/orderCostsEnum";
import * as productVariantsServices from "./productVariantsServices";
import * as addressesServices from "./addressesServices";
import { sendFactorSmsOrder, sendSmsSuccessOrder } from "../utils/smsUtils";
import { Order } from "sequelize";
import { formattedDataUrl } from "../utils/dataUtils";
import puppeteer from "puppeteer";

type OrderItemsRequest = {
  id: number;
  product_id: number;
  variant_id: number;
  name: string;
  price: number;
  discount_price: number;
  quantity: number;
};

type OrderRequest = {
  address_id: number;
  // total_cost,
  discount_code: string;
  // discount_amount,
  // delivery_cost,
  type_of_delivery: string;
  type_of_payment: string;
  items: OrderItemsRequest[];
  services: number;
  guarantee: number;
  businessProfit: number;
  shipping: number;
  callback_url: string;
  description: string;
};

type AdminOrderRequest = {
  address_id: number;
  // total_cost,
  discount_amount: number;
  // discount_amount,
  // delivery_cost,
  status: string;
  payment_status: number;
  irr_calculate_mode: CreateOrderIrrMode | UpdateOrderIrrMode;
  type_of_delivery: string;
  type_of_payment: string;
  items: OrderItemsRequest[];
  servicesPercentage: number;
  guaranteePercentage: number;
  businessProfitPercentage: number;
  shippingPercentage: number;
};

type BaseIrrMode = { mode: "manual"; value: number } | { mode: "stored" };

type CreateOrderIrrMode = BaseIrrMode;
type UpdateOrderIrrMode = BaseIrrMode | { mode: "current" };

interface OrdersWithTotalOrderItems extends orders {
  order_items: order_items[];
}

interface orderWithAddressAndItems extends orders {
  order_items: order_items[];
  address: addresses;
}

const Orders = initModels().orders;
const OrderItems = initModels().order_items;
const Users = initModels().users;
const Addresses = initModels().addresses;
const Products = initModels().products;
const ProductVariants = initModels().products_variants;

const defaultGuaranteePercentage = 5;
const defaultServicesPercentage = 9;
const defaultBusinessProfitPercentage = 10;
const defaultShippingCostPercentage = 40;

export const createOrderService = async (
  data: OrderRequest,
  user: { id: number; phone_number: string }
) => {
  const { id: user_id, phone_number } = user;

  const {
    discount_code,
    address_id,
    type_of_delivery,
    type_of_payment,
    items,
    services: predeterminedServicesCost,
    guarantee: predeterminedGuaranteeCost,
    businessProfit: predeterminedBusinessProfitCost,
    shipping: predeterminedShipping,
  } = data;

  const t = await Orders.sequelize?.transaction();

  try {
    const dollarToIrrRecord = await variablesServices.getVariableByName(
      "usdToIrr"
    );

    let total_cost: number = 0;
    let discount_amount: number = 0;
    let delivery_cost: number = 0;

    let { description, itemsCost } = await validateOrderItemsService(items);

    // console.log(itemsCost);
    const orderAdditionalCosts = calculateAdditionalOrderCosts<OrderCosts>(
      [
        {
          name: OrderCosts.services,
          percentage: defaultServicesPercentage,
          predetermined: predeterminedServicesCost,
        },
        {
          name: OrderCosts.guarantee,
          percentage: defaultGuaranteePercentage,
          predetermined: predeterminedGuaranteeCost,
        },
        {
          name: OrderCosts.businessProfit,
          percentage: defaultBusinessProfitPercentage,
          predetermined: predeterminedBusinessProfitCost,
        },
        {
          name: OrderCosts.shipping,
          percentage: defaultShippingCostPercentage,
          predetermined: predeterminedShipping,
        },
      ],
      itemsCost
    );

    if (discount_code) {
      const discountValidate = await validateDiscount(
        discount_code,
        itemsCost,
        user_id
      );
      // console.log(discountValidate);
      if (discountValidate.success && discountValidate?.discount_amount) {
        discount_amount = discountValidate.discount_amount;
        itemsCost = itemsCost - discount_amount;
        // increase the time of the discountcode that used
        await useDiscountCode(discount_code);
      } else {
        throw new AppError(
          discountValidate?.message || "somthing wrong with discount code",
          400
        );
      }
    }

    const { businessProfit, guaranteeCost, servicesCost, shippingCost } =
      orderAdditionalCosts;
    total_cost =
      itemsCost + guaranteeCost + servicesCost + businessProfit + shippingCost;

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
        shipping_cost: shippingCost,
        // id: date.getTime(),
      },
      { transaction: t }
    );

    if (items && items.length > 0) {
      const orderItems = items.map((item: OrderItemsRequest) => ({
        ...item,
        order_id: newOrder.id,
      }));
      await OrderItems.bulkCreate(orderItems, { transaction: t });
    }

    const { callback_url } = data;
    if (type_of_payment == "1" && !callback_url) {
      await t?.rollback();
      throw new AppError("provide callback url", 400);
    }
    if (
      type_of_payment == "1" &&
      callback_url &&
      description &&
      !haveGateWayLimitation
    ) {
      const paymentRequestResult = await RequestPayment({
        amount: irrPrice,
        callback_url,
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
        return {
          success: true,
          message: "Order created successfully",
          order: newOrder,
          paymentUrl: redirectUrl,
        };
        // console.log(newOrder);
      } else {
        await t?.rollback();
        throw new AppError(
          paymentRequestResult?.message ?? "خطایی رخ داد",
          502
        );
      }
    } else if (type_of_payment == "1" && haveGateWayLimitation) {
      await t?.commit();

      return {
        success: true,
        message: "Order created successfully",
        // order: newOrder,
        paymentUrl: `/products/checkout/finalize-order-payment?orderId=${newOrder.id}`,
      };
    } else if (type_of_payment == "0") {
      await t?.commit();

      return {
        success: true,
        message: "Order created successfully",
        paymentUrl: `/dashboard/order/${newOrder.id}`,
      };
    }
  } catch (error) {
    await t?.rollback();
    throw error;
  }
};

export const adminCreateOrderService = async (
  data: AdminOrderRequest,
  user: { id: number }
) => {
  const { id: user_id } = user;

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
  } = data;

  const t = await Orders.sequelize?.transaction();
  try {
    let total_cost: number = 0;
    // let discount_amount: number = 0;
    let delivery_cost: number = 0;

    let { itemsCost } = await validateOrderItemsService(items);

    const additionalCosts = calculateAdditionalOrderCosts<OrderCosts>(
      [
        {
          name: OrderCosts.businessProfit,
          percentage: businessProfitPercentage,
        },
        { name: OrderCosts.shipping, percentage: shippingPercentage },
        { name: OrderCosts.guarantee, percentage: guaranteePercentage },
        { name: OrderCosts.services, percentage: servicesPercentage },
      ],
      itemsCost
    );

    if (discount_amount && discount_amount > 0) {
      itemsCost = itemsCost - discount_amount;
    }

    const { businessProfit, guaranteeCost, servicesCost, shippingCost } =
      additionalCosts;

    total_cost =
      itemsCost + businessProfit + shippingCost + guaranteeCost + servicesCost;
    // console.log(description);

    let orderIrrCurrency = 0;
    if (irr_calculate_mode.mode === "manual") {
      if (!irr_calculate_mode.value || irr_calculate_mode.value <= 0) {
        throw new AppError("please enter valid currency", 400);
      }
      orderIrrCurrency = irr_calculate_mode.value;
    } else {
      const dollarExchangeRecord = await variablesServices.getVariableByName(
        "usdToIrr"
      );
      orderIrrCurrency = +dollarExchangeRecord.value;
    }

    // const irrCurrency = +dollarExchangeRecord.value;
    const irr_total_cost = Math.round(
      calculateIrPriceByCurrency(total_cost, orderIrrCurrency)
    );

    const newOrder = await Orders.create(
      {
        user_id,
        address_id,
        total_cost,
        business_profit: businessProfit,
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
      const orderItems = items.map((item: OrderItemsRequest) => ({
        ...item,
        order_id: newOrder.id,
      }));
      await OrderItems.bulkCreate(orderItems, { transaction: t });
    }

    const addressInfo = await addressesServices.addressByIdService(
      newOrder.address_id
    );

    await sendFactorSmsOrder(
      addressInfo.phone_number,
      addressInfo.full_name,
      newOrder.id
      // verifyResult.ref_id
    );
    await t?.commit();

    return newOrder;
  } catch (error) {
    await t?.rollback();
    throw error;
  }
};

export const finalizeUserOrderService = async ({
  orderId,
  user_id,
  phone_number,
  callback_url,
}: {
  orderId: number | string;
  user_id: number;
  phone_number: string;
  callback_url: string;
}) => {
  // const { id: orderId } = req.body;
  // const { id: user_id, phone_number } = req.user;
  // console.log(orderId);
  // console.log(req.body);

  if (!user_id || !phone_number || !orderId) {
    throw new AppError("provide all information", 400);
  }
  const transaction = await Orders.sequelize?.transaction();
  try {
    const userOrder = await Orders.findByPk(orderId, {
      transaction,
    });
    if (!userOrder) {
      throw new AppError("order not found", 404);
    }

    if (userOrder.user_id !== user_id) {
      throw new AppError("access denied", 401);
    }

    const { irr_total_cost } = userOrder;

    const haveGateWayLimitation = irr_total_cost > 200000000;

    const description = `سفارش ${userOrder.id} پرداخت شد`;

    if (!haveGateWayLimitation) {
      const paymentRequestResult = await RequestPayment({
        amount: irr_total_cost,
        callback_url,
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
        return {
          success: true,
          message: "Order created successfully",
          order: userOrder,
          paymentUrl: redirectUrl,
        };
        // console.log(newOrder);
      } else {
        await transaction?.rollback();
        throw new AppError(
          paymentRequestResult?.message || "خطایی رخ داد",
          paymentRequestResult.status || 400
        );
      }
    } else {
      await transaction?.commit();
      return {
        success: true,
        message: "Order created successfully",
        // order: newOrder,
        paymentUrl: `/products/checkout/finalize-order-payment?orderId=${userOrder.id}`,
      };
    }
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
};

export const listOrdersService = async (userId: number | string) => {
  const orders: OrdersWithTotalOrderItems[] = await Orders.findAll({
    where: {
      user_id: userId,
    },
    order: [
      [
        // params?.sort?.toString() ||
        "created_at",
        // params?.order?.toString() ||
        "DESC",
      ],
    ],
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

  return ordersWithTotalQuantity;
};

export const adminListOrderService = async () => {
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
      { model: Users, as: "user" },
      { model: Addresses, as: "address" },
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

  return ordersWithTotalQuantity;
};

export const getOrderService = async (
  orderId: number | string,
  user: { id: number; role: number },
  options: { includeProductVariants: string }
) => {
  const order: OrdersWithTotalOrderItems | null = await Orders.findByPk(
    orderId,
    {
      include: [
        {
          model: OrderItems,
          as: "order_items",
          include: [
            {
              model: Products,
              as: "product",
              include:
                options.includeProductVariants == "true"
                  ? [{ model: ProductVariants, separate: true, as: "variants" }]
                  : [],
            },
            { model: ProductVariants, as: "variant" },
          ],
        },
        { model: Addresses, as: "address" },
        { model: Users, as: "user" },
      ],
      order: [
        // Order order_items by product.name
        [
          { model: OrderItems, as: "order_items" },
          { model: Products, as: "product" },
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
    }
  );

  if (!order) {
    throw new AppError("سفارش مورد نظر یافت نشد", 404);
  }
  if (order.user_id !== user?.id && user?.role !== 2) {
    throw new AppError("شما به این سفارش دسترسی ندارید", 401);
  }

  if (!order.order_items) {
    throw new AppError("the order dont have any items", 422);
  }

  const modifiedOrder = {
    ...order.dataValues,
    products_cost: order?.order_items.reduce(
      (cost: number = 0, item) =>
        cost + getCurrentPrice(item.price, item.discount_price) * item.quantity,
      0
    ),
    order_items: order?.order_items.map((item) => ({
      ...item.dataValues,
      product: {
        ...formattedDataUrl(item.product.dataValues, "images"), // Example change
      },
    })),
  };

  return modifiedOrder;
};

export const updateOrderService = async (
  orderId: number,
  data: AdminOrderRequest
) => {
  const {
    address_id,
    // update_irr,
    irr_calculate_mode,
    discount_amount,
    // delivery_cost,
    type_of_delivery,
    type_of_payment,
    status,
    payment_status,
    servicesPercentage,
    guaranteePercentage,
    businessProfitPercentage,
    shippingPercentage,
    items,
  } = data;

  const transaction = await Orders.sequelize?.transaction();

  try {
    const order = await Orders.findByPk(orderId, {
      transaction,
      include: { model: order_items, as: "order_items" },
    });

    if (!order) {
      throw new AppError("order not found", 404);
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
        throw new AppError("please enter valid order status", 400);
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
            throw new AppError("cannot find item variant", 404);
          }
          let itemVariantStock = itemVariant.stock;
          if (["4"].includes(status)) {
            itemVariantStock = itemVariantStock + orderItem.quantity;
          } else if (["2"].includes(status)) {
            if (itemVariantStock <= 0) {
              throw new AppError("out of stock", 422);
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
          if (irrCalculateMode.value >= 0 || !Number(irrCalculateMode.value))
            throw new AppError("please enter valid currency", 400);

          orderIrrCurrencyPrice = irrCalculateMode.value;
        } else {
          const dollarToIrrRecord = await variablesServices.getVariableByName(
            "usdToIrr"
          );
          orderIrrCurrencyPrice = +dollarToIrrRecord.value;
        }
      }
      if (items) {
        const { itemsCost } = await validateOrderItemsService(items);
        new_items_cost = itemsCost;
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
        const newCosts = calculateAdditionalOrderCosts<OrderCosts>(
          [
            {
              name: OrderCosts.businessProfit,
              percentage: businessProfitPercentage,
            },
            { name: OrderCosts.shipping, percentage: shippingPercentage },
            { name: OrderCosts.guarantee, percentage: guaranteePercentage },
            { name: OrderCosts.services, percentage: servicesPercentage },
          ],
          new_items_cost
        );
        businessProfitCost = newCosts.businessProfit;
        servicesCost = newCosts.servicesCost;
        guaranteeCost = newCosts.guaranteeCost;
        shippingCost = newCosts.shippingCost;
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
      // delivery_cost,
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
        where: { order_id: orderId },
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
        if (item.id !== undefined && existingItemsMap.has(item.id)) {
          itemsToUpdate.push({ ...item, order_id: orderId });
          incomingExistingIds.add(item.id);
        } else {
          itemsToCreate.push({ ...item, order_id: orderId });
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
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
};

export const deleteOrderService = async (orderId: number | string) => {
  const transaction = await Orders.sequelize?.transaction();
  try {
    const order = await Orders.findByPk(orderId, { transaction });

    if (!order) {
      throw new AppError("cannot find order", 404);
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

    await OrderItems.destroy({ where: { order_id: orderId }, transaction });
    await order.destroy({ transaction });
    await transaction?.commit();
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
};

export const verifyPaymentService = async (authority: string) => {
  const order: orderWithAddressAndItems | null = await orders.findOne({
    where: { payment_authority: authority },
    include: [
      { model: OrderItems, as: "order_items" },
      { model: Addresses, as: "address" },
    ],
  });
  if (!order || !order.order_items) {
    throw new AppError("متاسفانه سفارش پیدا نشد", 404);
  }
  const amount = order?.irr_total_cost;
  // console.log("here");
  // console.log(order);
  // console.log(authority);
  // console.log(amount);

  if (!authority || !amount) {
    throw new AppError("authority and amount is required", 422);
  }

  const data = await RequestVerifyPayment({ authority, amount });
  const verifyResult = data?.data || data;

  // console.log(data, " : data");
  // console.log(verifyResult, " : verify");
  // console.log(items, ":items");

  if (verifyResult.code === 100) {
    await order.update({ payment_status: 1 });
  }

  if (
    !order?.address &&
    (verifyResult.code !== 100 || verifyResult.code !== 101)
  ) {
    const errorMessage =
      zarinpalErrorMessages[verifyResult.code.toString()] ||
      "خطای نامشخصی رخ داده است.";
    throw new AppError(errorMessage, 422);
  }
  await sendSmsSuccessOrder(
    order.address.phone_number,
    order.address.full_name,
    order.id,
    verifyResult.ref_id
  );

  return {
    success: true,
    message: "پرداخت با موفقیت انجام شد.",
    ref_id: verifyResult.ref_id,
    verifyStatus: "OK",
  };
};

export const validateOrderItemsService = async (items: OrderItemsRequest[]) => {
  let itemsCost = 0;
  let description = "";

  for (const item of items) {
    const variant = await productVariantsServices.singleVariantService(
      item.variant_id
    );

    if (!variant) {
      throw new AppError("محصول مورد نظر یافت نشد", 404);
    }

    if (!variant.stock || item.quantity > variant.stock) {
      throw new AppError("موجودی محصول مورد نظر تمام شده", 400);
    }

    const clientPrice = getCurrentPrice(item.price, item.discount_price);

    const dbPrice = getCurrentPrice(variant.price, variant.discount_price);

    if (clientPrice !== dbPrice) {
      throw new AppError("در بررسی محصولات خطایی رخ داد", 400);
    }

    description += `${variant.product_id} : ${item.quantity}\n`;
    itemsCost += dbPrice * item.quantity;
  }

  return {
    itemsCost,
    description,
  };
};

export const createPdfOrderService = async (
  orderId: number | string,
  token?: string,
  options?: {
    isAdmin?: boolean | string;
    lang?: string;
    choosedAccount?: string;
    withoutPricing?: string;
  }
) => {
  if (!token) {
    throw new AppError("unaughtorize", 401);
  }
  if (!orderId) {
    throw new AppError("provide order ID", 400);
  }

  const ifisAdmin = options?.isAdmin == "true" ? "/admin/" : "";
  const ifIsEn = options?.lang == "en" ? "en" : "/";
  const pdfUrl = `${process.env.APP_URL}${ifisAdmin}dashboard/order/${orderId}/${ifIsEn}?pdf=1&bank=${options?.choosedAccount}&withoutPricing=${options?.withoutPricing}`;

  // console.log(pdfUrl);

  let browser;
  browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    waitForInitialPage: true,
  });

  try {
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

    return pdf;
  } catch (error) {
    throw error;
  } finally {
    if (browser) browser.close();
  }
};
