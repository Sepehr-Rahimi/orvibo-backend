import { Router } from "express";
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import bannerCoverUpload from "../config/multer/bannerCoverUpload";
import validateRequest from "../middleware/validateRequest";
import { createBannerSchema, updateBannerSchema } from "../utils/validate";
import {
  adminBannerList,
  bannerList,
  createBanner,
  deleteBanner,
  singleBanner,
  updateBanner,
} from "../controllers/bannersController";
import { UserRoles } from "../enums/userRolesEnum";

const router = Router();

router.get("/list/", bannerList);
router.get("/one/:id", singleBanner);

router.use(authenticateToken, authorize([UserRoles.Admin]));

router.post(
  "/create",
  bannerCoverUpload.single("cover"),
  validateRequest(createBannerSchema),
  createBanner
);

router.get("/admin_list/", adminBannerList);

router.post(
  "/update/:id",
  bannerCoverUpload.single("cover"),
  validateRequest(updateBannerSchema),
  updateBanner
);

router.post("/delete/:id", deleteBanner);

export default router;
