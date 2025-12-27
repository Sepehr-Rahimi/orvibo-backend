import { Router } from "express";
import validateRequest from "../middleware/validateRequest";
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import {
  createDiscountCode,
  deleteDiscountCode,
  getDiscountCode,
  listDiscountCodes,
  updateDiscountCode,
  validateDiscountCode,
} from "../controllers/discountCodesController";
import {
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
} from "../utils/validate";
import { UserRoles } from "../enums/userRolesEnum";

const router = Router();

router.get("/list", listDiscountCodes);

router.get("/one/:id", getDiscountCode);

router.use(authenticateToken);

router.post("/validate", validateDiscountCode);

router.use(authorize([UserRoles.Admin]));

// Create a new brand
router.post(
  "/create",
  validateRequest(createDiscountCodeSchema),
  createDiscountCode
);

router.post(
  "/update/:id",
  validateRequest(updateDiscountCodeSchema),
  updateDiscountCode
);

router.post("/delete/:id", deleteDiscountCode);

export default router;
