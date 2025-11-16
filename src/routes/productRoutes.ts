import express from "express";
import {
  adminProductList,
  adminSingleProduct,
  createProduct,
  deleteProduct,
  deleteProductImages,
  getProductCategories,
  productList,
  searchProduct,
  similarProducts,
  singleProduct,
  singleProductByName,
  singleProductBySlug,
  updateProduct,
} from "../controllers/productController";
import productImageUpload from "../config/multer/productImageUpload";
import validateRequest from "../middleware/validateRequest";
import { createProductsSchema, updateProductsSchema } from "../utils/validate";
import { authenticateAdminToken } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/list", productList);

router.get("/admin_list", authenticateAdminToken, adminProductList);

router.get("/search", searchProduct);

router.get("/one/:id", singleProduct);

router.get("/name/:name", singleProductByName);

router.get("/slug/:slug", singleProductBySlug);

router.get("/admin_one/:id", authenticateAdminToken, adminSingleProduct);

router.post(
  "/create",
  authenticateAdminToken,
  productImageUpload.array("images[]"),
  validateRequest(createProductsSchema),
  createProduct
);

router.post(
  "/update/:id",
  authenticateAdminToken,
  productImageUpload.array("images[]"),
  validateRequest(updateProductsSchema),
  updateProduct
);

router.post("/delete/:id", authenticateAdminToken, deleteProduct);

router.post("/delete_images/:id", authenticateAdminToken, deleteProductImages);

router.get("/similar_products", similarProducts);

router.get("/product-category", getProductCategories);

export default router;
