import { categoriesAttributes, initModels } from "../models/init-models";
import { buildCategoryTree, getParentCategories } from "../utils/categoryUtils";
import { formattedDataUrl, pick } from "../utils/dataUtils";
import { AppError } from "../utils/error";
import { deleteFile, updateFile } from "../utils/fileUtils";

const Categories = initModels().categories;

export const createCategoryService = async (
  data: categoriesAttributes & { file: { path: string } }
) => {
  const { parent_id, file } = data;
  if (!parent_id && !file) {
    throw new AppError("icon file is require", 400);
  }

  const image_url = file?.path.replace(/\\/g, "/"); // Path where the uploaded file is stored

  // Create the category
  const newCategory = await Categories.create({
    ...pick(data, ["name", "description", "parent_id"]),
    image_url,
  });

  return formattedDataUrl(newCategory.dataValues, "image_url");
};

export const categoryListService = async (parentId?: number | string) => {
  const categories = await Categories.findAll({
    where: parentId
      ? {
          parent_id: parentId,
        }
      : {},
  });

  // Check if there are no categories found
  if (categories.length === 0) {
    return [];
  }

  const categoriesWithImage = categories.map((c) =>
    formattedDataUrl(c.dataValues, "image_url")
  );

  return categoriesWithImage;
};

export const singleCategoryService = async (categoryId: string) => {
  // Validate the ID
  const parsedId = parseInt(categoryId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid category id", 400);
  }

  // Fetch the category from the database
  const category = await Categories.findByPk(parsedId);

  // Check if the category exists
  if (!category) {
    throw new AppError("category not found", 404);
  }

  return formattedDataUrl(category.dataValues, "image_url");
};

export const singleCategoryByNameService = async (categoryName: string) => {
  // Fetch the category from the database
  const category = await Categories.findOne({
    where: {
      name: categoryName,
    },
  });

  // Check if the category exists
  if (!category) {
    throw new AppError("category not found", 404);
  }

  return formattedDataUrl(category.dataValues, "image_url");
};

export const parentCategoryService = async (categoryId: string) => {
  // Validate the ID
  const parsedId = parseInt(categoryId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid category id", 400);
  }

  // Fetch the category from the database
  const parents = await getParentCategories(parsedId);

  // Check if the category exists
  if (!parents) {
    throw new AppError("no parent found", 404);
  }

  return parents;
};

export const updateCategoryService = async (
  categoryId: string | number,
  data: categoriesAttributes & { file: { path: string } }
) => {
  // Ensure the user is authenticated
  if (!categoryId) {
    throw new AppError("provide valid id", 400);
  }

  const category = await Categories.findByPk(categoryId);

  if (!category) {
    throw new AppError("category not found", 404);
  }

  const { file } = data;

  const newIconPath = file ? file.path : undefined;
  const updatedIconPath = await updateFile(newIconPath, category.image_url);

  // Update the category record
  await category.update({
    ...pick(data, ["name", "description"]),
    image_url: updatedIconPath,
  });

  return formattedDataUrl(category.dataValues, "image_url");
};

export const deleteCategoryService = async (categoryId: string) => {
  const parsedId = parseInt(categoryId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid id", 400);
  }
  // Find the category in the database
  const category = await Categories.findByPk(parsedId);
  if (!category) {
    throw new AppError("category not found", 404);
  }

  // Delete the category from the database
  deleteFile(category.image_url);
  await category.destroy();
};

export const categoryTreeListService = async () => {
  const categories = await Categories.findAll();

  const formatedCategories = categories.map((category) => {
    return {
      ...formattedDataUrl(
        { ...category.dataValues, label: category.name },
        "image_url"
      ),
    };
  });

  const categoryTree = buildCategoryTree(formatedCategories);

  // Check if there are no categories found
  if (categories.length === 0) {
    return [];
  }

  return categoryTree;
};
