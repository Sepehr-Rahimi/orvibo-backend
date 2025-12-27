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
  finalizeUserOrder,
  getOrder,
  listOrders,
  listOrdersAdmin,
  updateOrder,
  verifyPayment,
} from "../controllers/ordersController";
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import { UserRoles } from "../enums/userRolesEnum";
const router = express.Router();

router.use(authenticateToken);

router.post("/verify-payment", verifyPayment);

router.get("/list", listOrders);

router.get("/one/:id", getOrder);

router.get("/:id/pdf", createOrderPdf);

router.post("/finalize-order", finalizeUserOrder);

router.post("/create", validateRequest(createOrderSchema), createOrder);

router.get("/list/admin", authorize([UserRoles.Admin]), listOrdersAdmin);

router.use(authorize([UserRoles.Admin, UserRoles.Seller]));

router.post(
  "/adminCreate",
  validateRequest(createOrderAdminSchema),
  adminCreateOrder
);

router.post("/update/:id", validateRequest(updateOrderSchema), updateOrder);

router.post("/delete/:id", deleteOrder);

export default router;
