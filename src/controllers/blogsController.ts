import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { formatedFileUrl } from "../utils/formatedFileUrl";
import { updateFile } from "../utils/updateFile";
import { deleteFile } from "../utils/deleteFile";

const Blog = initModels().blogs;

// Create Blog
export const createBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      summary,
      content,
      tags,
      meta_title,
      meta_description,
      meta_keywords,
      is_published,
    } = req.body;
    const cover = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

    const newBlog = await Blog.create({
      title,
      summary,
      content,
      cover,
      tags,
      meta_title,
      meta_description,
      meta_keywords,
      is_published: is_published === "true",
    });

    res.status(201).json({
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Blogs
export const blogList = async (req: Request, res: Response): Promise<void> => {
  try {
    const blogs = await Blog.findAll({
      where: {
        is_published: true,
      },
    });
    const blogsWithImage = blogs.map((blog) => ({
      ...blog.dataValues,
      cover: formatedFileUrl(blog.cover),
    }));
    res.status(200).json({ success: true, data: blogsWithImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminBlogList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blogs = await Blog.findAll();
    const blogsWithImage = blogs.map((blog) => ({
      ...blog.dataValues,
      cover: formatedFileUrl(blog.cover),
    }));
    res.status(200).json({ success: true, data: blogsWithImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Single Blog
export const singleBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const blog = await Blog.findByPk(id);
    if (!blog) {
      res.status(400).json({ success: false, message: "Blog not found." });
      return;
    }
    if (!blog.is_published) {
      res
        .status(400)
        .json({ success: false, message: "Blog is not published." });
      return;
    }
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const adminSingleBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const blog = await Blog.findByPk(id);
    if (!blog) {
      res.status(400).json({ success: false, message: "Blog not found." });
      return;
    }
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getBlogByTitle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const title = decodeURIComponent(req.params.title); // Get the title from the request

    if (!title) {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const singleBlog = await Blog.findOne({
      where: { title },
    });

    if (!singleBlog) {
      res.status(404).json({ success: false, message: "Blog not found" });
      return;
    }
    if (!singleBlog.is_published) {
      res
        .status(404)
        .json({ success: false, message: "Blog is not published" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...singleBlog.dataValues,
        cover: formatedFileUrl(singleBlog.cover),
      },
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAdminBlogByTitle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const title = decodeURIComponent(req.params.title); // Get the title from the request

    if (!title) {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const singleBlog = await Blog.findOne({
      where: { title },
    });

    if (!singleBlog) {
      res.status(404).json({ success: false, message: "Blog not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...singleBlog.dataValues,
        cover: formatedFileUrl(singleBlog.cover),
      },
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Blog
export const updateBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      content,
      tags,
      meta_title,
      meta_description,
      meta_keywords,
      is_published,
    } = req.body;
    const blog = await Blog.findByPk(id);

    if (!blog) {
      res.status(400).json({ error: "Blog not found." });
      return;
    }
    const newCoverPath = req.file ? req.file.path : undefined;
    const updatedCoverPath = await updateFile(newCoverPath, blog.cover);

    await blog.update({
      title,
      summary,
      content,
      cover: updatedCoverPath,
      tags,
      meta_title,
      meta_description,
      meta_keywords,
      is_published: is_published === "true",
    });

    res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// Delete Blog
export const deleteBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const blog = await Blog.findByPk(id);
    if (!blog) {
      res.status(404).json({ success: false, message: "Blog not found." });
      return;
    }
    deleteFile(blog.cover);

    await blog.destroy();
    res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
