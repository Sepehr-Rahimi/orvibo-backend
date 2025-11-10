import { Router } from "express";
import { authenticateAdminToken } from "../middleware/authMiddleware";
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

const router = Router();

router.post(
  "/create",
  authenticateAdminToken,
  bannerCoverUpload.single("cover"),
  validateRequest(createBannerSchema),
  createBanner
);

router.get("/list/", bannerList);
router.get("/admin_list/", authenticateAdminToken, adminBannerList);

router.get("/one/:id", singleBanner);

router.post(
  "/update/:id",
  authenticateAdminToken,
  bannerCoverUpload.single("cover"),
  validateRequest(updateBannerSchema),
  updateBanner
);

router.post("/delete/:id", authenticateAdminToken, deleteBanner);

export default router;
