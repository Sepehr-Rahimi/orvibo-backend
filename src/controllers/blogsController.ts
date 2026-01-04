import { NextFunction, Request, Response } from "express";

import {
  adminBlogListService,
  adminSingleBlogByTitleService,
  adminSingleBlogService,
  blogListService,
  createBlogService,
  deleteBlogService,
  singleBlogByTitleService,
  singleBlogService,
  updateBlogService,
} from "../services/blogsServices";

// Create Blog
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newBlog = createBlogService({ ...req.body, file: req.file });

    res.status(201).json({
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Blogs
export const blogList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const blogs = await blogListService();
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    next(error);
  }
};

export const adminBlogList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const blogs = await adminBlogListService();
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    next(error);
  }
};

// Get Single Blog
export const singleBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const blog = await singleBlogService(id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

export const adminSingleBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const blog = await adminSingleBlogService(id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

export const getBlogByTitle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const title = decodeURIComponent(req.params.title); // Get the title from the request

    const blog = singleBlogByTitleService(title);

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminBlogByTitle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const title = decodeURIComponent(req.params.title); // Get the title from the request
    const blog = await adminSingleBlogByTitleService(title);
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Update Blog
export const updateBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const blog = await updateBlogService(id, { ...req.body, file: req.file });

    res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (error) {
    next(error);
  }
};

// Delete Blog
export const deleteBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const blog = await deleteBlogService(id);
    res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully." });
  } catch (error) {
    next(error);
  }
};
