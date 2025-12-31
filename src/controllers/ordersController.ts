import { NextFunction, Request, Response } from "express";
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
import { formattedFileUrl } from "../utils/fileUtils";
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
import {
  adminCreateOrderService,
  adminListOrderService,
  createOrderService,
  createPdfOrderService,
  deleteOrderService,
  finalizeUserOrderService,
  getOrderService,
  listOrdersService,
  updateOrderService,
  validateOrderItemsService,
  verifyPaymentService,
} from "../services/orderServices";
import { AppError } from "../utils/error";
import { calculateAdditionalOrderCosts } from "../utils/orderUtils";
import { OrderCosts } from "../enums/orderCostsEnum";
import { getVariableByName } from "../services/variablesServices";

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

const models = initModels();
const Orders = models.orders;
const OrderItems = models.order_items;
const Address = models.addresses;
const Product = models.products;
const users = models.users;
const ProductVariants = models.products_variants;
const variables = models.variables;

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const response = await createOrderService({ ...req.body }, req.user);
    res.status(201).json({
      message: response?.message,
      order: response?.order,
      paymentUrl: response?.paymentUrl,
      success: response?.success,
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreateOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newOrder = await adminCreateOrderService({ ...req.body }, req.user);
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const finalizeUserOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: orderId, callback_url } = req.body;
    const { id: user_id, phone_number } = req.user;
    const response = await finalizeUserOrderService({
      orderId,
      user_id,
      phone_number,
      callback_url,
    });

    res.json({
      success: true,
      message: response.message,
      order: response.order,
      paymentUrl: response.paymentUrl,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await listOrdersService(req.user?.id);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const listOrdersAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // const user_id = req?.user?.id;

  try {
    const orders = await adminListOrderService();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  const { includeProductVariants = "false" } = req.query;

  try {
    const order = await getOrderService(id, req.user, {
      includeProductVariants: includeProductVariants.toString(),
    });
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const order = await updateOrderService(Number(id), { ...req.body });
    res
      .status(200)
      .json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  // const { restore } = req.body;
  console.log(req.body);

  try {
    const order = await deleteOrderService(id);
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { authority } = req.body;
  try {
    const result = await verifyPaymentService(authority);
    res.status(200).json({ ...result });
  } catch (error) {
    res
      .status(500)
      .json({ message: error || "somthing went wrong", success: false });
    console.error("Error verifying payment:", error);
    return;
  }
};

export const createOrderPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const token = req?.headers?.authorization?.split(" ")[1];
  const { bank: choosedAccount, lang, isAdmin, withoutPricing } = req.query;
  try {
    // console.log("choosed account is :", choosedAccount);
    const pdf = await createPdfOrderService(id, token, {
      choosedAccount: choosedAccount?.toString(),
      lang: lang?.toString(),
      isAdmin: isAdmin?.toString(),
      withoutPricing: withoutPricing?.toString(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${id}.pdf`
    );
    res.setHeader("Content-Length", pdf.length);
    res.end(pdf);
  } catch (error) {
    next(error);
  }
};
