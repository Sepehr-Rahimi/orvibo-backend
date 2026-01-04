import { categoriesAttributes, initModels } from "../models/init-models";

const Category = initModels().categories;

interface categoriesTreeList extends categoriesAttributes {
  children?: categoriesTreeList[];
}

/**
 * Recursively fetch all parent categories of a given category.
 * @param categoryId - The ID of the category to start with.
 * @returns An array of parent categories (starting from the direct parent to the topmost parent).
 */
export const getParentCategories = async (
  categoryId: number
): Promise<categoriesAttributes[]> => {
  if (!categoryId) return [];

  const parentCategories: categoriesAttributes[] = [];

  let currentCategory = await Category.findByPk(categoryId);

  if (currentCategory) parentCategories.push(currentCategory);

  while (currentCategory && currentCategory.parent_id) {
    const parentCategory = await Category.findByPk(currentCategory.parent_id);

    if (parentCategory) {
      parentCategories.push(parentCategory); // Add the parent to the list
      currentCategory = parentCategory; // Move up the hierarchy
    } else {
      break; // Stop if no parent is found
    }
  }

  return parentCategories.reverse(); // Reverse to show from topmost parent to immediate parent
};

export const getChildCategories = async (
  categoryId: number
): Promise<categoriesAttributes[]> => {
  const childCategories: categoriesAttributes[] = [];

  let currentCategory = await Category.findByPk(categoryId);

  if (currentCategory) childCategories.push(currentCategory);

  // Helper function to recursively find children
  const fetchChildren = async (parentId: number) => {
    const children = await Category.findAll({ where: { parent_id: parentId } });

    for (const child of children) {
      childCategories.push(child); // Add child to the list
      await fetchChildren(child.id); // Recursively find its children
    }
  };

  await fetchChildren(categoryId);

  return childCategories;
};

export const buildCategoryTree = (
  categories: categoriesTreeList[],
  parentId: number | null = null
): categoriesTreeList[] => {
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
};
