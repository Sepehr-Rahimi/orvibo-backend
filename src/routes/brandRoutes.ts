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
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import { UserRoles } from "../enums/userRolesEnum";

const router = Router();

router.get("/list", brandList);

router.get("/one/:id", singleBrand);

router.get("/name/:name", singleBrandByName);

router.use(authenticateToken, authorize([UserRoles.Admin]));

router.post(
  "/create",
  brandLogoUpload.single("logo_url"),
  validateRequest(createBrandSchema),
  createBrand
);

router.post(
  "/update/:id",
  brandLogoUpload.single("logo_url"),
  validateRequest(createBrandSchema),
  updateBrand
);

router.post("/delete/:id", deleteBrand);

export default router;
