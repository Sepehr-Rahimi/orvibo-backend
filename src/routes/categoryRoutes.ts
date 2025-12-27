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
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import { UserRoles } from "../enums/userRolesEnum";

const router = Router();

router.get("/list/:parent_id?", categoryList);

router.get("/all", allCategoryList);

router.get("/tree_list/", categoryTreeList);

router.get("/one/:id", singleCategory);

router.get("/name/:name", singleCategoryByName);

router.get("/parent_categories/:id?", parentCategories);

router.use(authenticateToken, authorize([UserRoles.Admin]));

router.post(
  "/create",
  categoryImageUpload.single("image_url"),
  validateRequest(createCategorySchema),
  createCategory
);

router.post(
  "/update/:id",
  categoryImageUpload.single("image_url"),
  validateRequest(createCategorySchema),
  updateCategory
);

router.post("/delete/:id", deleteCategory);

export default router;
