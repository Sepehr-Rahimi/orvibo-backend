import { Router } from "express";
import validateRequest from "../middleware/validateRequest";
import { createBlogSchema, updateBlogSchema } from "../utils/validate";
import {
  adminBlogList,
  adminSingleBlog,
  blogList,
  createBlog,
  deleteBlog,
  getAdminBlogByTitle,
  getBlogByTitle,
  singleBlog,
  updateBlog,
} from "../controllers/blogsController";
import categoryImageUpload from "../config/multer/categoryImageUpload";
import blogCoverUpload from "../config/multer/blogCoverUpload";
import { authenticateAdminToken } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/create",
  authenticateAdminToken,
  blogCoverUpload.single("cover"),
  validateRequest(createBlogSchema),
  createBlog
);

router.get("/list/", blogList);
router.get("/admin_list/", authenticateAdminToken, adminBlogList);

router.get("/one/:id", singleBlog);
router.get("/admin_one/:id", authenticateAdminToken, adminSingleBlog);

router.get("/title/:title", getBlogByTitle);
router.get("/admin_title/:title", authenticateAdminToken, getAdminBlogByTitle);

router.post(
  "/update/:id",
  authenticateAdminToken,
  blogCoverUpload.single("cover"),
  validateRequest(updateBlogSchema),
  updateBlog
);

router.post("/delete/:id", authenticateAdminToken, deleteBlog);

export default router;
