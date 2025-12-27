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
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import { UserRoles } from "../enums/userRolesEnum";
const router = express.Router();

router.get("/list", productList);

router.get("/search", searchProduct);

router.get("/name/:name", singleProductByName);

router.get("/one/:id", singleProduct);

router.get("/slug/:slug", singleProductBySlug);

router.get("/similar_products", similarProducts);

router.get("/product-category", getProductCategories);

router.use(authenticateToken);
router.use(authorize([UserRoles.Admin]));

router.get("/admin_one/:id", adminSingleProduct);

router.post(
  "/create",
  productImageUpload.array("images[]"),
  validateRequest(createProductsSchema),
  createProduct
);

router.post(
  "/update/:id",
  productImageUpload.array("images[]"),
  validateRequest(updateProductsSchema),
  updateProduct
);

router.post("/delete/:id", deleteProduct);

router.post("/delete_images/:id", deleteProductImages);

router.get("/admin_list", adminProductList);

export default router;
