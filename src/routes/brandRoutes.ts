import { Router } from "express";
import {
  brandList,
  createBrand,
  deleteBrand,
  singleBrand,
  singleBrandByName,
  updateBrand,
} from "../controllers/brandController";
import brandLogoUpload from "../config/multer/brandLogoUpload";
import validateRequest from "../middleware/validateRequest";
import { createBrandSchema } from "../utils/validate";
import { authenticateAdminToken } from "../middleware/authMiddleware";

const router = Router();

// Create a new brand
router.post(
  "/create",
  authenticateAdminToken,
  brandLogoUpload.single("logo_url"),
  validateRequest(createBrandSchema),
  createBrand
);

router.get("/list", brandList);

router.get("/one/:id", singleBrand);

router.get("/name/:name", singleBrandByName);

router.post(
  "/update/:id",
  authenticateAdminToken,
  brandLogoUpload.single("logo_url"),
  validateRequest(createBrandSchema),
  updateBrand
);

router.post("/delete/:id", authenticateAdminToken, deleteBrand);

export default router;
