import { Request, Response } from "express";
import {
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

// type_of_payment === 1 : payment with bankaccount via zarinpal
// type_of_payment === 0 : siteAdmin create factor

interface OrderItemsWithProduct extends order_items {
  product: products;
}

interface OrdersWithOrderItems extends orders {
  order_items?: OrderItemsWithProduct[];
}

interface orderWithAddressAndItems extends orders {
  order_items?: order_itemsAttributes[];
  address?: addressesAttributes;
}

const models = initModels();
const Orders = models.orders;
const OrderItems = models.order_items;
const Address = models.addresses;
const Product = models.products;
const users = models.users;

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
    } = req.body;

    const t = await Orders.sequelize?.transaction();

    let total_cost: number = 0;
    let discount_amount: number = 0;
    let delivery_cost: number = 0;
    let description: string = "";

    for (const item of items) {
      const product = await products.findByPk(item.product_id);
      if (product && product?.stock) {
        const newProdDescription = `${product.name} : ${item.quantity} \n`;
        description = description + newProdDescription;

        if (item.quantity > product.stock) {
          res.status(422).json({
            success: false,
            message: "متاسفانه محصول مورد نظر به مقدار تعیین شده موجود نیست.",
          });
          return;
        }
        const productPrice: number =
          product?.discount_price && product.discount_price > 0
            ? product.discount_price
            : product.price;
        total_cost += productPrice * item.quantity;
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
        total_cost = total_cost - discount_amount;
        // increase the time of the discountcode that used
        await useDiscountCode(discount_code);
      } else {
        res.status(422).json(discountValidate);
      }
    }

    // console.log(total_cost);

    // const date = new Date();
    const newOrder = await Orders.create(
      {
        user_id,
        address_id,
        total_cost,
        discount_code,
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
      type_of_delivery,
      type_of_payment,
      items,
    } = req.body;

    const t = await Orders.sequelize?.transaction();

    let total_cost: number = 0;
    // let discount_amount: number = 0;
    let delivery_cost: number = 0;
    let description: string = "";

    for (const item of items) {
      // console.log(item, "item ");
      const product = await products.findByPk(item.product_id);
      // console.log(product, "product");
      if (product && product?.stock) {
        if (item.quantity > product.stock) {
          res.status(422).json({
            success: false,
            message: "متاسفانه محصول مورد نظر به مقدار تعیین شده موجود نیست.",
          });
          return;
        }
        const newProdDescription = `${product.name} : ${item.quantity} \n`;
        description = description + newProdDescription;

        const itemPrice: number = item?.discount_price || item.price;
        total_cost += itemPrice * item.quantity;
      }
    }

    if (discount_amount && discount_amount > 0) {
      total_cost = total_cost - discount_amount;
    }

    // console.log(description);

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

export const listOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user_id = req?.user?.id;

  interface OrdersWithTotalOrderItems extends orders {
    order_items?: order_items[];
  }

  try {
    const orders: OrdersWithTotalOrderItems[] = await Orders.findAll({
      where: {
        user_id,
      },
      include: [OrderItems],
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
    order_items?: order_items[];
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
      include: [OrderItems, users, Address],
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

  try {
    const order: OrdersWithOrderItems | null = await Orders.findByPk(id, {
      include: [
        { model: OrderItems, include: [Product] },
        Address,
        { model: users, as: "user" },
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
        ...order.toJSON(),
        order_items: order?.order_items.map((item) => ({
          ...item.toJSON(),
          product: {
            ...item.product.toJSON(),
            images: item?.product?.images.map((image) =>
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
    total_cost,
    discount_code,
    discount_amount,
    delivery_cost,
    type_of_delivery,
    type_of_payment,
    status,
    payment_status,
    items,
  } = req.body;

  const transaction = await Orders.sequelize?.transaction();

  try {
    const order = await Orders.findByPk(id, { transaction });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      await transaction?.rollback();
      return;
    }

    const unblockedTransitions: Record<string, string[]> = {
      "1": ["2", "3"],
      "2": ["4"],
      "3": ["1"],
      "4": ["1"],
    };

    // if (status && !unblockedTransitions[order.status]?.includes(status)) {
    //   res
    //     .status(422)
    //     .json({
    //       message: "please enter valid status for order",
    //       success: false,
    //     });
    //   return;
    // }

    if (status && order.status !== status && order.type_of_payment != "1") {
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
          const product = await products.findByPk(orderItem.product_id);
          if (!product) {
            res
              .status(404)
              .json({ message: "cannot find the product", success: false });
            return;
          }
          let productStock = product.stock;
          if (["4"].includes(status)) {
            productStock = productStock + orderItem.quantity;
          } else if (["2"].includes(status)) {
            if (productStock <= 0) {
              res.status(422).json({ message: "out of stock", success: false });
              return;
            }
            productStock = Math.max(productStock - orderItem.quantity, 0);
          }
          product.update({ stock: productStock });
        })
      );
      // for (const orderItem of orderItems) {
      //   const product = await products.findByPk(orderItem.product_id);
      //   if (!product) {
      //     res
      //       .status(404)
      //       .json({ message: "cannot find the product", success: false });
      //     return;
      //   }
      //   let productStock = product.stock;
      //   if (status === "3" || status === "4") {
      //     productStock = productStock + orderItem.quantity;
      //   } else if (status === "2" || status === "1") {
      //     productStock = productStock - orderItem.quantity;
      //   }
      //   product.update({ stock: productStock });
      // }
    }

    let new_total_cost = items && items.length > 0 ? 0 : total_cost;

    if (items) {
      for (const item of items) {
        // console.log(item, "item ");
        const product = await products.findByPk(item.product_id);
        // console.log(product, "product");
        if (product && product?.stock) {
          if (item.quantity > product.stock) {
            res.status(422).json({
              success: false,
              message: "متاسفانه محصول مورد نظر به مقدار تعیین شده موجود نیست.",
            });
            await transaction?.rollback();
            return;
          }

          const itemPrice: number = item.price;
          new_total_cost += itemPrice * item.quantity;
        }
      }
    }

    if (discount_amount && discount_amount > 0) {
      new_total_cost = new_total_cost - discount_amount;
    }

    await order.update({
      address_id,
      total_cost: new_total_cost,
      discount_code,
      discount_amount,
      delivery_cost,
      type_of_delivery,
      type_of_payment,
      status,
      payment_status,
    });

    if (items) {
      await OrderItems.destroy({ where: { order_id: id } });
      const orderItems = items.map((item: any) => ({
        ...item,
        order_id: id,
      }));
      await OrderItems.bulkCreate(orderItems);
    }

    await transaction?.commit();
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

interface OrderWithItems extends orders {
  order_items?: order_items[];
}

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { authority } = req.body;

  const order: orderWithAddressAndItems | null = await orders.findOne({
    where: { payment_authority: authority },
    include: [{ model: OrderItems }, Address],
  });
  if (!order || !order.order_items) {
    res.status(401).json({ message: "سفارش پیدا نشد", success: false });
    return;
  }
  const amount = order?.total_cost;
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
        const product = await Product.findByPk(item.product_id);
        if (
          product &&
          product.stock &&
          order.payment_status == 0 &&
          order.type_of_payment == "1"
          // order.type_of_delivery == "1"
        ) {
          const newStock = Math.max(product.stock - item.quantity, 0);
          await product.update({ stock: newStock });
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
