import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { fileUrlToPath, formatedFileUrl } from "../utils/formatedFileUrl";
import { updateFile } from "../utils/updateFile";
import { deleteFile } from "../utils/deleteFile";
import {
  getChildCategories,
  getParentCategories,
} from "../utils/categoryUtils";
import { Op, Sequelize } from "sequelize";
import { log } from "node:console";
import paginationUtil from "../utils/paginationUtil";
import axios from "axios";
import { normalizePersian } from "../scripts/papulateEmbeddings";
import { createProductEmbedding } from "../utils/embeddingUtil";
import similarity from "compute-cosine-similarity";
import sequelize from "../config/database";
import { l2Distance } from "pgvector/sequelize";

const Product = initModels().products;
const Categories = initModels().categories;
const Brand = initModels().brands;
const ProductEmbedding = initModels().products_embedding;
const variables = initModels().variables;

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const transaction = await Product.sequelize?.transaction();

  try {
    const {
      name,
      // price,
      currency_price: productCurrency,
      discount_percentage,
      summary,
      colors,
      sizes,
      stock,
      main_features,
      description,
      kinds,
      model,
      category_id,
      brand_id,
      code,
      label,
      is_published,
    } = req.body;

    // Handle images
    const images = Array.isArray(req.files)
      ? req.files.map((file: Express.Multer.File) =>
          file.path.replace(/\\/g, "/")
        )
      : [];

    const currency = await variables.findOne({ where: { name: "currency" } });
    if (!currency) {
      res.status(422).json({ message: "نرخ دلار پیدا نشد", success: false });
      await transaction?.rollback();
      return;
    }

    const currentCurrency = +currency.value;

    const productPrice =
      Math.ceil((productCurrency * currentCurrency) / 10000) * 10000;
    let discount_price = 0;

    if (discount_percentage && discount_percentage > 0)
      discount_price =
        Math.ceil(
          (productPrice - (productPrice * discount_percentage) / 100) / 10000
        ) * 10000;

    const newProduct = await Product.create(
      {
        name,
        price: productPrice,
        currency_price: productCurrency,
        discount_price,
        summary,
        colors,
        sizes,
        stock,
        images,
        main_features,
        description,
        kinds,
        model,
        category_id,
        brand_id,
        code,
        label,
        is_published: is_published === "true",
        // embedding,
      },
      { transaction }
    );

    const embedText = normalizePersian(`${name} - ${summary} - ${description}`);

    const embedding = await createProductEmbedding(embedText);
    if (!embedding) {
      res.status(400).json({
        message: "somthing went wrong with embedding",
        success: false,
      });
      await transaction?.rollback();

      return;
    }

    const formatedEmbedding = `[${embedding.join(",")}]`;

    const embed = await ProductEmbedding.create(
      {
        embedding: formatedEmbedding,
        product_id: newProduct.id,
      },
      { transaction }
    );
    await newProduct.update({ embedding_id: embed.id }, { transaction });

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...newProduct.dataValues,
        images: newProduct.images?.map((image) => formatedFileUrl(image)),
      },
    });
    await transaction?.commit();
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
    await transaction?.rollback();
  }
};

export const productList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const params = req?.query;

  const whereClause: any = {
    is_published: true,
  };

  if (params?.category) {
    const parents = await getChildCategories(+params?.category);
    const categoriesIdList = parents.map((c) => c.id);
    whereClause.category_id = { [Op.in]: categoriesIdList };
  }

  if (params?.category_name) {
    const categoryName = decodeURIComponent(params.category_name.toString());
    const selectedCategory = await Categories.findOne({
      where: { name: categoryName },
    });

    const categoryId = selectedCategory?.id;

    if (categoryId) {
      const parents = await getChildCategories(+categoryId);
      const categoriesIdList = parents.map((c) => c.id);
      whereClause.category_id = { [Op.in]: categoriesIdList };
    } else {
      whereClause.category_id = { [Op.in]: [] };
    }
  }

  if (params?.brand_name) {
    const brandName = decodeURIComponent(params.brand_name.toString());
    const selectedBrand = await Brand.findOne({
      where: { name: brandName },
    });

    const brandId = selectedBrand?.id;

    if (brandId) {
      whereClause.brand_id = brandId;
    }
  }

  if (params?.search) {
    whereClause[Op.or] = {
      name: { [Op.iLike]: `%${params.search}%` },
      code: { [Op.iLike]: `%${params.search}%` },
      model: { [Op.iLike]: `%${params.search}%` },
    };
  }

  if (params?.featured === "true") {
    whereClause.discount_price = { [Op.gt]: 0 }; // Only products with discount_price > 0
  }

  const paginate = paginationUtil(req, res);

  try {
    const { rows: products, count: total } = await Product.findAndCountAll({
      limit: paginate && paginate.limit,
      offset: paginate && paginate.offset,
      where: whereClause,
      order: [
        [Sequelize.literal('"products"."stock" > 0'), "DESC"],

        [
          params?.sort?.toString() || "created_at",
          params?.order?.toString() || "DESC",
        ],
        ["id", "DESC"],
      ],
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });

    const formattedProducts = products.map((product) => ({
      ...product.dataValues,
      images: product.images?.map((image) => formatedFileUrl(image)),
    }));

    res.status(200).json({
      success: true,
      products: formattedProducts,
      pagination: paginate && {
        page: paginate.page,
        limit: paginate.limit,
        total,
        hasMore: paginate.offset + formattedProducts.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const adminProductList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const params = req?.query;

  // console.log(params);
  // console.log(params?.order);
  const whereClause: any = {};

  if (params?.category) {
    const parents = await getChildCategories(+params?.category);
    const categoriesIdList = parents.map((c) => c.id);
    whereClause.category_id = { [Op.in]: categoriesIdList };
  }

  if (params?.search) {
    whereClause[Op.or] = {
      name: { [Op.iLike]: `%${params.search}%` },
      code: { [Op.iLike]: `%${params.search}%` },
      model: { [Op.iLike]: `%${params.search}%` },
    };
  }

  if (params?.featured == "true") {
    whereClause.discount_price = { [Op.gt]: 0 }; // Only products with discount_price > 0
  }

  const paginate = paginationUtil(req, res);
  // console.log("pagination is : ", paginate);

  try {
    const { rows: products, count: total } = await Product.findAndCountAll({
      limit: paginate && paginate.limit,
      offset: paginate && paginate.offset,
      where: whereClause,
      order: [
        [
          params?.sort?.toString() || "created_at",
          params?.order?.toString() || "DESC",
        ],
      ],
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });

    const formattedProducts = products.map((product) => {
      let discount_percentage = 0;
      if (product.discount_price) {
        discount_percentage =
          ((product.price - product.discount_price) / product.price) * 100;
      }
      return {
        ...product.dataValues,
        discount_percentage,
        images: product.images?.map((image) => formatedFileUrl(image)),
      };
    });

    res.status(200).json({
      success: true,
      products: formattedProducts,
      pagination: paginate && {
        page: paginate.page,
        limit: paginate.limit,
        total,
        hasMore: paginate.offset + formattedProducts.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const searchProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const params = req?.query;

  const whereClause: any = {};

  if (params?.search) {
    whereClause[Op.or] = {
      name: { [Op.iLike]: `%${params.search}%` },
      code: { [Op.iLike]: `%${params.search}%` },
      model: { [Op.iLike]: `%${params.search}%` },
    };
  }

  const paginate = paginationUtil(req, res);

  try {
    const { rows: products, count: total } = await Product.findAndCountAll({
      limit: paginate && paginate.limit,
      offset: paginate && paginate.offset,
      where: whereClause,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });

    const formattedProducts = products.map((product) => ({
      ...product.dataValues,
      images: product.images?.map((image) => formatedFileUrl(image)),
    }));

    res.status(200).json({
      success: true,
      products: formattedProducts,
      pagination: paginate && {
        page: paginate.page,
        limit: paginate.limit,
        total,
        hasMore: paginate.offset + formattedProducts.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const singleProductByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name } = req.params;

  try {
    const product = await Product.findOne({
      where: {
        name: decodeURIComponent(name),
      },
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });
    if (!product) {
      res.status(400).json({ success: false, message: "Product not found." });
      return;
    }

    if (!product.is_published) {
      res
        .status(400)
        .json({ success: false, message: "Product is not published." });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...product.dataValues,
        images: product.images?.map((image) => formatedFileUrl(image)),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const singleProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }

    const product = await Product.findByPk(parsedId, {
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });
    if (!product) {
      res.status(400).json({ success: false, message: "Product not found." });
      return;
    }

    if (!product.is_published) {
      res
        .status(400)
        .json({ success: false, message: "Product is not published." });
      return;
    }

    let discount_percentage = 0;
    if (product.discount_price) {
      discount_percentage =
        ((product.price - product.discount_price) / product.price) * 100;
    }

    res.status(200).json({
      success: true,
      data: {
        ...product.dataValues,
        discount_percentage,
        images: product.images?.map((image) => formatedFileUrl(image)),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const adminSingleProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }

    const product = await Product.findByPk(parsedId, {
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });
    if (!product) {
      res.status(400).json({ success: false, message: "Product not found." });
      return;
    }

    let discount_percentage = 0;

    if (product.discount_price)
      discount_percentage = (product?.discount_price / product.price) * 100;

    res.status(200).json({
      success: true,
      data: {
        ...product.dataValues,
        discount_percentage,
        images: product.images?.map((image) => formatedFileUrl(image)),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      // price,
      currency_price: NewproductCurrency,
      discount_percentage,
      summary,
      colors,
      sizes,
      stock,
      main_features,
      description,
      kinds,
      model,
      category_id,
      brand_id,
      code,
      label,
      is_published,
      orderImages,
    } = req.body;

    // console.log(is_published);

    const { id } = req.params;

    const product = await Product.findByPk(id);

    const targetProductEmbedding = await ProductEmbedding.findByPk(
      product?.embedding_id
    );

    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    // const images = Array.isArray(req.files)
    //   ? req.files.map((file: Express.Multer.File) =>
    //       file.path.replace(/\\/g, "/")
    //     )
    //   : [];

    let embedding = targetProductEmbedding?.embedding;

    if (
      (summary && product?.summary !== summary) ||
      (name && product?.name !== name) ||
      (description && product?.description !== description)
    ) {
      const text = normalizePersian(`${name} - ${summary} - ${description}`);
      const newEmbedding = await createProductEmbedding(text);
      if (!newEmbedding) {
        res.status(400).json({
          message: "somthing went wrong with embedding",
          success: false,
        });
        return;
      }
      embedding = `[${newEmbedding.join(",")}]`;
      await targetProductEmbedding?.update({ embedding });
    }

    // const newImages = Array.isArray(req.files)
    //   ? req.files.map((file: Express.Multer.File) =>
    //       file.path.replace(/\\/g, "/")
    //     )
    //   : [];

    const bodyImages = req.body.images; // could be string or array
    const urls = Array.isArray(bodyImages)
      ? bodyImages
      : bodyImages
      ? [bodyImages]
      : [];

    const files = req.files as Express.Multer.File[];

    // console.log(files);

    // Rebuild the array in the same order
    const allImages = [];
    let fileIndex = 0;
    let urlIndex = 0;

    // The trick: look at req.body["images[]"] order
    // const rawOrder = orderImages;
    // console.log("raworder", rawOrder);
    // console.log("body", req.body);
    // const orderArray = Array.isArray(rawOrder) ? rawOrder : [rawOrder];

    // console.log("images", orderImages);

    if (orderImages && orderImages?.length > 0) {
      for (let i = 0; i < orderImages?.length; i++) {
        const value = orderImages[i];
        if (value == "url") {
          allImages.push(fileUrlToPath(urls[urlIndex]));
          urlIndex++;
        } else {
          // this slot was a file (Multer stripped the original value)
          const file = files[fileIndex];
          file.path.replace(/\\/g, "/");
          allImages.push(file.path);
          fileIndex++;
        }
      }
    }
    const updatedImages = allImages.length > 0 ? allImages : product.images;
    // product?.dataValues?.images
    //   ? [...product?.dataValues.images, ...newImages]
    //   :
    // console.log("images:", updatedImages);

    const productCurrency = NewproductCurrency ?? product.currency_price;
    let productPrice = product.price;
    const currentProductCurrency = product.currency_price;
    if (currentProductCurrency !== productCurrency) {
      const currency = await variables.findOne({ where: { name: "currency" } });
      if (!currency) {
        res.status(422).json({ message: "نرخ پیدا نشد", success: false });
        return;
      }
      productPrice =
        Math.ceil((productCurrency * +currency?.value) / 10000) * 10000;
    }

    let current_discount_price = 0;
    if (discount_percentage && discount_percentage > 0) {
      current_discount_price =
        Math.ceil(
          (productPrice - (productPrice * discount_percentage) / 100) / 10000
        ) * 10000;
    }

    await product.update({
      name,
      price: productPrice,
      discount_price: current_discount_price,
      summary,
      colors,
      sizes: sizes || [],
      stock,
      main_features,
      description,
      kinds: kinds || [],
      model,
      category_id,
      brand_id,
      code,
      label,
      is_published: is_published == "true",
      images: updatedImages,
      currency_price: productCurrency,
      // embedding,
    });

    res.status(200).json({
      message: "Product updated successfully",
      product: {
        ...product.dataValues,
        images: updatedImages?.map((image) => formatedFileUrl(image)),
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const deleteProductImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { images } = req.body;

    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(400).json({ error: "Product not found." });
      return;
    }

    // console.log(images);

    for (const image of images) {
      const path = fileUrlToPath(image);
      // console.log(image);
      // console.log(path);
      await deleteFile(path);
    }

    // console.log(images);
    // console.log(product.images);

    const newImages = product.images?.filter(
      (image) => !images.map((i: string) => fileUrlToPath(i)).includes(image)
    );

    // console.log(newImages);

    await product.update({
      images: newImages,
    });

    res.status(200).json({
      message: "Product updated successfully",
      // product: {
      //   ...product.dataValues,
      //   images: updatedImages?.map((image) => formatedFileUrl(image)),
      // },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }

    const product = await Product.findByPk(parsedId);
    const targetEmbedding = await ProductEmbedding.findByPk(
      product?.embedding_id
    );

    if (!product) {
      res.status(400).json({ success: false, message: "Product not found." });
      return;
    }

    product.images?.forEach((image) => deleteFile(image));
    await product.destroy();
    await targetEmbedding?.destroy();

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const similarProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ message: "please enter the currect id" });
    return;
  }

  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }
    const product = await Product.findByPk(parsedId, {
      // include: [{ model: ProductEmbedding, as: "productEmbedding" }],
    });
    if (!product) {
      res.status(400).json({ success: false, message: "cannot find product" });
      return;
    }

    const selectedProductEmbedding = await ProductEmbedding.findByPk(
      product.embedding_id
    );

    // console.log(typeof selectedProductEmbedding?.embedding);
    if (!selectedProductEmbedding) {
      res
        .status(404)
        .json({ message: "cannot find embedding", success: false });
      return;
    }

    const formatted = JSON.parse(selectedProductEmbedding.embedding);

    const foundProductsId = await ProductEmbedding.findAll({
      order: l2Distance("embedding", formatted, sequelize),
      limit: 8,
      attributes: ["id", "product_id"],
    });

    const foundProduct = await Product.findAll({
      where: { id: foundProductsId.map((p) => p.product_id) },
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
    });

    const formatedProducts = foundProduct.map((p) => ({
      ...p.dataValues,
      images: p.images?.map((image) => formatedFileUrl(image)),
    }));

    // const allProducts = await Product.findAll({
    //   where: {
    //     id: { [Op.ne]: parsedId },
    //   },
    //   include: [{ model: ProductEmbedding, as: "productEmbedding" }],
    // });

    // const results = allProducts.map((prod) => {
    //   const prodEmbedding = prod.productEmbedding?.embedding ?? [];
    //   if (prodEmbedding.length !== product.productEmbedding.embedding?.length)
    //     return null;

    //   return {
    //     ...prod.toJSON(),
    //     similarityScore: similarity(
    //       product?.productEmbedding?.embedding,
    //       prodEmbedding
    //     ),
    //     images: prod.images?.map((image) => formatedFileUrl(image)),
    //   };
    // });

    // const machedResault = results
    //   .sort((a, b) => {
    //     const bSimilarity = b?.similarityScore ?? 0;
    //     const aSimilarity = a?.similarityScore ?? 0;
    //     return bSimilarity - aSimilarity;
    //   })
    //   .filter((prod) => prod?.similarityScore && prod?.similarityScore > 0.75)
    //   .slice(0, 8);

    res.status(200).json({ success: true, data: formatedProducts });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
