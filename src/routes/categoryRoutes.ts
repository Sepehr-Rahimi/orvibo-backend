import { Router } from "express";
import validateRequest from "../middleware/validateRequest";
import { createCategorySchema } from "../utils/validate";
import {
  allCategoryList,
  categoryList,
  categoryTreeList,
  createCategory,
  deleteCategory,
  parentCategories,
  singleCategory,
  singleCategoryByName,
  updateCategory,
} from "../controllers/categoryController";
import categoryImageUpload from "../config/multer/categoryImageUpload";
import { authenticateAdminToken } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/create",
  authenticateAdminToken,
  categoryImageUpload.single("image_url"),
  validateRequest(createCategorySchema),
  createCategory
);

router.get("/list/:parent_id?", categoryList);

router.get("/all", allCategoryList);

router.get("/tree_list/", categoryTreeList);

router.get("/one/:id", singleCategory);

router.get("/name/:name", singleCategoryByName);

router.get("/parent_categories/:id?", parentCategories);

router.post(
  "/update/:id",
  authenticateAdminToken,
  categoryImageUpload.single("image_url"),
  validateRequest(createCategorySchema),
  updateCategory
);

router.post("/delete/:id", authenticateAdminToken, deleteCategory);

export default router;
