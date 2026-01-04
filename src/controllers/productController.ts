import { NextFunction, Request, response, Response } from "express";
import {
  initModels,
  products,
  products_variants,
  products_variantsAttributes,
} from "../models/init-models";
import {
  extractImages,
  fileUrlToPath,
  formattedFileUrl,
} from "../utils/fileUtils";
import { deleteFile } from "../utils/fileUtils";
import { getChildCategories } from "../utils/categoryUtils";
import { Op, Sequelize } from "sequelize";
import paginationUtil from "../utils/paginationUtil";
import { normalizePersian } from "../utils/embeddingUtil";
import {
  createProductEmbedding,
  dataBaseEmbeddingFormat,
} from "../utils/embeddingUtil";
import sequelize from "../config/database";
import {
  calculateDiscountPercentagePrice,
  calculateDiscountPercentage,
  calculateIrPriceByCurrency,
  calculateNewPriceByNewCurrency,
} from "../utils/mathUtils";
import {
  formatVariants,
  modifyDiscountPrice,
  orderingProductImages,
} from "../utils/productUtils";
import {
  adminProductListService,
  adminSingleProductByIdService,
  createProductService,
  deleteProductImagesService,
  deleteProductService,
  getProductCategoriesService,
  productListService,
  searchProductService,
  similarProductsService,
  singleProductByIdService,
  singleProductByNameService,
  singleProductBySlugService,
  updateProductService,
} from "../services/productServices";

const Product = initModels().products;
const Categories = initModels().categories;
const Brand = initModels().brands;
const ProductEmbedding = initModels().products_embedding;
const variables = initModels().variables;
const ProductVariants = initModels().products_variants;

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // const transaction = await sequelize?.transaction();
  try {
    const product = await createProductService({
      ...req.body,
      files: req.files,
    });
    res.status(201).json({
      message: "Product created successfully",
      product: product,
    });
  } catch (error) {
    next(error);
  }
};

export const productList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const params = req?.query;

  try {
    const products = await productListService(params);

    res.status(200).json({
      success: true,
      products: products,
      // pagination: paginate && {
      //   page: paginate.page,
      //   limit: paginate.limit,
      //   total,
      //   hasMore: paginate.offset + formattedProducts.length < total,
      // },
    });
  } catch (error) {
    next(error);
  }
};

export const adminProductList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const params = req?.query;
  const { page, limit } = req.query;

  try {
    const { pagination, products } = await adminProductListService({
      ...params,
      page: page?.toString(),
      limit: limit?.toString(),
    });
    // console.log(params);
    // console.log(params?.order);
    res.status(200).json({
      success: true,
      products,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const searchProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const params = req?.query;

  try {
    const { pagination, products } = await searchProductService(params);
    res.status(200).json({
      success: true,
      products,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const singleProductByName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { name } = req.params;
  const decodedName = decodeURIComponent(name);
  try {
    const product = await singleProductByNameService(decodedName);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const singleProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { slug } = req.params;

  try {
    const product = await singleProductBySlugService(slug);
    res.status(200).json({
      product: product,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const singleProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const product = await singleProductByIdService(id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const adminSingleProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const product = await adminSingleProductByIdService(id);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await updateProductService(id, {
      ...req.body,
      files: req.files,
    });
    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { images } = req.body;
    const product = await deleteProductImagesService(id, images);

    res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const product = await deleteProductService(id);
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const similarProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.query;

  try {
    const products = await similarProductsService(id?.toString());

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // console.log(req.query);
    const productWithCategories = await getProductCategoriesService(req.query);

    res.status(200).json({ success: true, data: productWithCategories });
  } catch (error) {
    next(error);
  }
};
