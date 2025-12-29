import { blogsAttributes } from "../models/blogs";
import { initModels } from "../models/init-models";
import { formattedCover, pick } from "../utils/dataUtils";
import { AppError } from "../utils/error";
import { deleteFile, updateFile } from "../utils/fileUtils";

const Blogs = initModels().blogs;

export const createBlogService = async (
  data: blogsAttributes & { file: { path: string } }
) => {
  const { file } = data;
  const cover = file ? file.path.replace(/\\/g, "/") : undefined;

  const newBlog = await Blogs.create({
    ...pick(data, [
      "title",
      "summary",
      "content",
      "tags",
      "meta_title",
      "meta_description",
      "meta_keywords",
      "is_published",
    ]),
    cover,
  });

  return newBlog;
};

export const blogListService = async () => {
  const blogs = await Blogs.findAll({
    where: {
      is_published: true,
    },
  });
  const blogsWithImage = blogs.map((blog) => formattedCover(blog.dataValues));

  return blogsWithImage;
};

export const adminBlogListService = async () => {
  const blogs = await Blogs.findAll();
  const blogsWithImage = blogs.map((blog) => formattedCover(blog.dataValues));

  return blogsWithImage;
};

export const singleBlogService = async (blogId?: number | string) => {
  if (!blogId) {
    throw new AppError("blog id was not provided", 400);
  }
  const blog = await Blogs.findByPk(blogId);
  if (!blog) {
    throw new AppError("blog not found", 404);
  }
  if (!blog.is_published) {
    throw new AppError("blog is not published", 400);
  }
  return formattedCover(blog.dataValues);
};

export const adminSingleBlogService = async (blogId: string | number) => {
  const blog = await Blogs.findByPk(blogId);
  if (!blog) {
    throw new AppError("blog not found", 404);
  }

  return formattedCover(blog.dataValues);
};

export const singleBlogByTitleService = async (blogTitle?: string) => {
  if (!blogTitle) {
    throw new AppError("title is not provided", 400);
  }

  const singleBlog = await Blogs.findOne({
    where: { title: blogTitle },
  });

  if (!singleBlog) {
    throw new AppError("blog not found", 404);
  }

  if (!singleBlog.is_published) {
    throw new AppError("blog is not published", 400);
  }

  return formattedCover(singleBlog.dataValues);
};

export const adminSingleBlogByTitleService = async (blogTitle?: string) => {
  if (!blogTitle) {
    throw new AppError("title is not provided", 400);
  }

  const singleBlog = await Blogs.findOne({
    where: { title: blogTitle },
  });

  if (!singleBlog) {
    throw new AppError("blog not found", 404);
  }

  return formattedCover(singleBlog.dataValues);
};

export const updateBlogService = async (
  blogId: number | string,
  data: blogsAttributes & { file: { path: string } }
) => {
  if (!blogId) throw new AppError("provide blog id", 400);
  const blog = await Blogs.findByPk(blogId);

  if (!blog) {
    throw new AppError("blog not found", 404);
  }

  const { file } = data;
  const newCoverPath = file ? file.path : undefined;
  const updatedCoverPath = await updateFile(newCoverPath, blog.cover);

  await blog.update({
    ...pick(data, [
      "title",
      "summary",
      "content",
      "tags",
      "meta_title",
      "meta_description",
      "meta_keywords",
      "is_published",
    ]),
    cover: updatedCoverPath,
  });
};

export const deleteBlogService = async (blogId: string | number) => {
  const blog = await Blogs.findByPk(blogId);
  if (!blog) {
    throw new AppError("blog not found", 404);
  }
  deleteFile(blog?.cover);

  await blog.destroy();
};
