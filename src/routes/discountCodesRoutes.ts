import { Router } from "express";
import validateRequest from "../middleware/validateRequest";
import {
  authenticateAdminToken,
  authenticateToken,
} from "../middleware/authMiddleware";
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

const router = Router();

// Create a new brand
router.post(
  "/create",
  authenticateAdminToken,
  validateRequest(createDiscountCodeSchema),
  createDiscountCode
);

router.get("/list", listDiscountCodes);

router.get("/one/:id", getDiscountCode);

router.post(
  "/update/:id",
  authenticateAdminToken,
  validateRequest(updateDiscountCodeSchema),
  updateDiscountCode
);

router.post("/delete/:id", authenticateAdminToken, deleteDiscountCode);

router.post("/validate", authenticateToken, validateDiscountCode);

export default router;
