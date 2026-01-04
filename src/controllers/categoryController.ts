import { NextFunction, Request, Response } from "express";

import {
  categoryListService,
  categoryTreeListService,
  createCategoryService,
  deleteCategoryService,
  parentCategoryService,
  singleCategoryByNameService,
  singleCategoryService,
  updateCategoryService,
} from "../services/categoryServices";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newCategory = await createCategoryService({
      ...req.body,
      file: req.file,
    });

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const categoryList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parent_id = req.params?.parent_id ?? null;

  try {
    // Fetch all categories from the database
    const categories = await categoryListService(parent_id);

    // Return the list of categories in the response
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const allCategoryList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categoryListService();

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const singleCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const category = await singleCategoryService(id);

    // Return the category details in the response
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const singleCategoryByName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const name = decodeURIComponent(req.params.name);

  try {
    const category = await singleCategoryByNameService(name);

    // Return the category details in the response
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const parentCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const parents = await parentCategoryService(id);

    // Return the category details in the response
    res.status(200).json({
      success: true,
      data: parents,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const category = await updateCategoryService(id, {
      ...req.body,
      file: req.file,
    });
    res.status(200).json({
      message: "اطلاعات دسته بندی با موفقیت ویرایش شد",
      category,
    });
    return;
  } catch (error) {
    next(error);
  }
};
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const category = await deleteCategoryService(id);
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const categoryTreeList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Fetch all categories from the database
    const categoryTree = await categoryTreeListService();

    // Return the list of categories in the response
    res.status(200).json({ success: true, data: categoryTree });
  } catch (error) {
    next(error);
  }
};
