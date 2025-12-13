import express from "express";
import {
  createProduct,
  deleteProduct,
  deleteProductImages,
  productList,
  singleProduct,
  updateProduct,
} from "../controllers/productController";
import productImageUpload from "../config/multer/productImageUpload";
import validateRequest from "../middleware/validateRequest";
import {
  createOrderAdminSchema,
  createOrderSchema,
  createProductsSchema,
  updateOrderSchema,
  updateProductsSchema,
} from "../utils/validate";
import {
  adminCreateOrder,
  createOrder,
  createOrderPdf,
  deleteOrder,
  getOrder,
  listOrders,
  listOrdersAdmin,
  updateOrder,
  verifyPayment,
} from "../controllers/ordersController";
import {
  authenticateAdminToken,
  authenticateToken,
} from "../middleware/authMiddleware";
const router = express.Router();

router.get("/list", authenticateToken, listOrders);

router.get("/list/admin", authenticateAdminToken, listOrdersAdmin);

router.get("/one/:id", authenticateToken, getOrder);

router.get("/:id/pdf", createOrderPdf);

router.post("/verify-payment", verifyPayment);

router.post(
  "/create",
  authenticateToken,
  validateRequest(createOrderSchema),
  createOrder
);

router.post(
  "/adminCreate",
  authenticateAdminToken,
  validateRequest(createOrderAdminSchema),
  adminCreateOrder
);

router.post(
  "/update/:id",
  authenticateAdminToken,
  validateRequest(updateOrderSchema),
  updateOrder
);

router.post("/delete/:id", authenticateAdminToken, deleteOrder);

export default router;
