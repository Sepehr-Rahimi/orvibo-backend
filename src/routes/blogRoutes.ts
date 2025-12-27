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
import blogCoverUpload from "../config/multer/blogCoverUpload";
import { authenticateToken, authorize } from "../middleware/authMiddleware";
import { UserRoles } from "../enums/userRolesEnum";

const router = Router();

router.get("/one/:id", singleBlog);
router.get("/title/:title", getBlogByTitle);
router.get("/list/", blogList);

router.use(authenticateToken, authorize([UserRoles.Admin]));

router.post(
  "/create",
  blogCoverUpload.single("cover"),
  validateRequest(createBlogSchema),
  createBlog
);

router.get("/admin_list/", adminBlogList);

router.get("/admin_one/:id", adminSingleBlog);

router.get("/admin_title/:title", getAdminBlogByTitle);

router.post(
  "/update/:id",
  blogCoverUpload.single("cover"),
  validateRequest(updateBlogSchema),
  updateBlog
);

router.post("/delete/:id", deleteBlog);

export default router;
