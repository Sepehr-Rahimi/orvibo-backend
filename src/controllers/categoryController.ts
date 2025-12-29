import { Request, Response } from "express";
import { categoriesAttributes, initModels } from "../models/init-models";
import { formattedFileUrl } from "../utils/fileUtils";
import { updateFile } from "../utils/fileUtils";
import { deleteFile } from "../utils/fileUtils";
import { getParentCategories } from "../utils/categoryUtils";
import { Op } from "sequelize";

const Category = initModels().categories;

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, parent_id } = req.body;

    if (!parent_id && !req.file) {
      res.status(400).json({ error: "icon file is required." });
      return;
    }

    const image_url = req?.file?.path.replace(/\\/g, "/"); // Path where the uploaded file is stored

    // Create the category
    const newCategory = await Category.create({
      name,
      image_url,
      description,
      parent_id,
    });

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
    return;
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const categoryList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parent_id = req.params?.parent_id ?? null;

  try {
    // Fetch all categories from the database
    const categories = await Category.findAll({
      where: {
        parent_id,
      },
    });

    // Check if there are no categories found
    if (categories.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const categoriesWithImage = categories.map((c) => ({
      ...c.dataValues,
      image_url: formattedFileUrl(c.image_url),
    }));

    // Return the list of categories in the response
    res.status(200).json({ success: true, data: categoriesWithImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const allCategoryList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all categories from the database
    const categories = await Category.findAll();

    // Check if there are no categories found
    if (categories?.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const categoriesWithImage = categories.map((c) => ({
      ...c.dataValues,
      image_url: formattedFileUrl(c.image_url),
    }));

    // Return the list of categories in the response
    res.status(200).json({ success: true, data: categoriesWithImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const singleCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid category ID." });
      return;
    }

    // Fetch the category from the database
    const category = await Category.findByPk(parsedId);

    // Check if the category exists
    if (!category) {
      res.status(400).json({ success: false, message: "Category not found." });
      return;
    }

    // Return the category details in the response
    res.status(200).json({
      success: true,
      data: {
        ...category.dataValues,
        image_url: formattedFileUrl(category.image_url),
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const singleCategoryByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name } = req.params;

  try {
    // Fetch the category from the database
    const category = await Category.findOne({
      where: {
        name: decodeURIComponent(name),
      },
    });

    // Check if the category exists
    if (!category) {
      res.status(400).json({ success: false, message: "Category not found." });
      return;
    }

    // Return the category details in the response
    res.status(200).json({
      success: true,
      data: {
        ...category.dataValues,
        image_url: formattedFileUrl(category.image_url),
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const parentCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid category ID." });
      return;
    }

    // Fetch the category from the database
    const parents = await getParentCategories(parsedId);

    // Check if the category exists
    if (!parents) {
      res.status(400).json({ success: false, message: "Category not found." });
      return;
    }

    // Return the category details in the response
    res.status(200).json({
      success: true,
      data: parents,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    const { id } = req.params;

    // Ensure the user is authenticated
    if (!id) {
      res.status(401).json({ error: "دسته بندی پیدا نشد" });
      return;
    }

    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ error: "دسته بندی پیدا نشده" });
      return;
    }

    // Update user fields

    // Handle file upload
    const newIconPath = req.file ? req.file.path : undefined;
    const updatedIconPath = await updateFile(newIconPath, category.image_url);

    // Update the category record
    await category.update({
      name,
      image_url: updatedIconPath,
      description,
    });

    res.status(200).json({
      message: "اطلاعات دسته بندی با موفقیت ویرایش شد",
      category,
    });
    return;
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid category ID." });
      return;
    }

    // Find the category in the database
    const category = await Category.findByPk(parsedId);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }

    // Delete the category from the database
    deleteFile(category.image_url);
    await category.destroy();

    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const categoryTreeList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all categories from the database
    const categories = await Category.findAll();

    const formatedCategories = categories.map((category) => {
      return {
        ...category.dataValues,
        label: category.name,
        image_url: formattedFileUrl(category.image_url),
      };
    });

    interface categoriesTreeList extends categoriesAttributes {
      children?: categoriesTreeList[];
    }

    function buildCategoryTree(
      categories: categoriesTreeList[],
      parentId: number | null = null
    ): categoriesTreeList[] {
      const tree: categoriesTreeList[] = [];

      for (const category of categories) {
        if (category.parent_id === parentId) {
          const children = buildCategoryTree(categories, category.id);
          if (children.length > 0) {
            category.children = children;
          }
          tree.push(category);
        }
      }

      return tree;
    }

    const categoryTree = buildCategoryTree(formatedCategories);

    // Check if there are no categories found
    if (categories.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    // Return the list of categories in the response
    res.status(200).json({ success: true, data: categoryTree });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
