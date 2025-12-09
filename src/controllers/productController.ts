import { Request, response, Response } from "express";
import {
  initModels,
  products,
  products_variants,
  products_variantsAttributes,
} from "../models/init-models";
import {
  extractImages,
  fileUrlToPath,
  formatedFileUrl,
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
import { formatVariants, modifyDiscountPrice } from "../utils/productUtils";

interface productWithVariants extends products {
  variants?: products_variants[];
}

const Product = initModels().products;
const Categories = initModels().categories;
const Brand = initModels().brands;
const ProductEmbedding = initModels().products_embedding;
const variables = initModels().variables;
const ProductVariants = initModels().products_variants;

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  // const transaction = await sequelize?.transaction();

  try {
    const {
      name,
      // price,
      // currency_price: productCurrency,
      // discount_percentage,
      summary,
      // colors,
      // sizes,
      // stock,
      slug,
      // main_features,
      description,
      model,
      category_id,
      brand_id,
      code,
      label,
      is_published,
      variants,
      weight,
    } = req.body;

    // Handle images
    const images = extractImages(req.files);

    const currency = await variables.findOne({ where: { name: "currency" } });

    if (!currency) {
      res.status(422).json({ message: "نرخ دلار پیدا نشد", success: false });
      // await transaction?.rollback();
      return;
    }

    const currentCurrency = +currency.value;

    // const productPrice = calculateIrPriceByCurrency(
    //   productCurrency,
    //   currentCurrency
    // );
    // let discount_price = 0;

    // if (discount_percentage && discount_percentage > 0)
    //   discount_price = calculateDiscountPercentagePrice(
    //     productPrice,
    //     discount_percentage
    //   );

    const newProduct = await Product.create(
      {
        name,
        // price: productPrice,
        // currency_price: productCurrency,
        // discount_price,
        summary,
        // colors,
        // sizes,
        // stock,
        slug,
        images,
        // main_features,
        description,
        // kinds,
        model,
        category_id,
        brand_id,
        code,
        label,
        weight,
        is_published: is_published === "true",
        // embedding,
      }
      // { transaction }
    );

    // const embedText = normalizePersian(`${name} - ${summary}`);
    // const embedding = await createProductEmbedding(embedText);

    //     id!: number;
    // product_id!: number;
    // color!: string;
    // kind?: string;
    // stock?: number;
    // currency_price?: number;
    // price?: number;
    // discount_price?: number;
    // is_published?: boolean;

    for (const singleVariant of variants) {
      const {
        currency_price,
        color,
        discount_percentage,
        is_published,
        stock,
        kind,
        sku,
      } = singleVariant;
      if (!currency_price || !color || !stock) {
        res.status(400).json({
          message: "please enter full information for currency",
          success: false,
        });
        return;
      }
      let variantDiscountPrice = 0;
      const variantPrice = calculateIrPriceByCurrency(
        currency_price,
        currentCurrency
      );
      if (discount_percentage && discount_percentage > 0) {
        variantDiscountPrice = calculateDiscountPercentagePrice(
          variantPrice,
          discount_percentage
        );
      }
      await ProductVariants.create({
        color,
        product_id: newProduct.id,
        currency_price,
        discount_price: variantDiscountPrice,
        is_published,
        price: variantPrice,
        sku,
        stock,
        kind,
      });
    }

    // if (!embedding) {
    //   res.status(400).json({
    //     message: "somthing went wrong with embedding",
    //     success: false,
    //   });
    //   // await transaction?.rollback();

    //   return;
    // }

    // const formatedEmbedding = dataBaseEmbeddingFormat(embedding);

    // await ProductEmbedding.create(
    //   {
    //     embedding: formatedEmbedding,
    //     product_id: newProduct.id,
    //   }
    //   // { transaction }
    // );

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...newProduct.dataValues,
        images: newProduct.images?.map((image) => formatedFileUrl(image)),
      },
    });
    // await transaction?.commit();
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
    // await transaction?.rollback();
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

  // const paginate = paginationUtil(req, res);

  try {
    const { rows: products, count: total } = await Product.findAndCountAll({
      // limit: paginate && paginate.limit,
      // offset: paginate && paginate.offset,
      where: whereClause,
      order: [
        // [Sequelize.literal('"products"."stock" > 0'), "DESC"],

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
        {
          model: ProductVariants,
          as: "variants",
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
      // pagination: paginate && {
      //   page: paginate.page,
      //   limit: paginate.limit,
      //   total,
      //   hasMore: paginate.offset + formattedProducts.length < total,
      // },
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
        {
          model: ProductVariants,
          as: "variants",
        },
      ],
    });

    const formattedProducts = products.map((product) => {
      // let discount_percentage = 0;
      // if (product.discount_price) {
      //   discount_percentage = calculateDiscountPercentage(
      //     product.price,
      //     product.discount_price
      //   );
      // }
      return {
        ...product.dataValues,
        // discount_percentage,
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
    }
  }

  const paginate = paginationUtil(req, res);

  try {
    const { rows: products, count: total } = await Product.findAndCountAll({
      limit: paginate && paginate.limit,
      offset: paginate && paginate.offset,
      where: whereClause,
      order: [
        // [Sequelize.literal('"products"."stock" > 0'), "DESC"],
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
        {
          model: ProductVariants,
          as: "variants",
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
        { model: ProductVariants, as: "variants" },
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

export const singleProductBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  if (!slug) {
    res.status(400).json({ message: "slug is required", success: false });
    return;
  }

  try {
    const product: productWithVariants | null = await Product.findOne({
      where: { slug },
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
        {
          model: ProductVariants,
          as: "variants",
        },
      ],
    });

    if (!product) {
      res.status(404).json({ message: "cant find product", success: false });
      return;
    }

    if (!product.is_published) {
      res
        .status(400)
        .json({ success: false, message: "Product is not published." });
      return;
    }

    const dollarToIrrRecord = await variables.findOne({
      where: { name: "usdToIrr" },
    });

    // console.log("dollar exchange is : ", dollarToIrrRecord);

    if (!dollarToIrrRecord) {
      res
        .status(404)
        .json({ message: "can't find dollar exchange", success: false });
      return;
    }

    const dollarToIrrExchange = +dollarToIrrRecord.value;

    res.status(200).json({
      product: {
        ...product.dataValues,
        images: product.images?.map((image) => formatedFileUrl(image)),
        variants: product.variants
          ? formatVariants(dollarToIrrExchange, product?.variants)
          : undefined,
      },
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "server error" });
    console.log(error);
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
        {
          model: ProductVariants,
          as: "variants",
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

    // let discount_percentage = 0;
    // if (product.discount_price) {
    //   discount_percentage = calculateDiscountPercentage(
    //     product.price,
    //     product.discount_price
    //   );
    // }

    res.status(200).json({
      success: true,
      data: {
        ...product.dataValues,
        // discount_percentage,
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

    const product: productWithVariants | null = await Product.findByPk(
      parsedId,
      {
        include: [
          {
            model: Categories,
            as: "category",
          },
          {
            model: Brand,
            as: "brand",
          },
          {
            model: ProductVariants,
            as: "variants",
          },
        ],
      }
    );
    if (!product) {
      res.status(400).json({ success: false, message: "Product not found." });
      return;
    }

    const formatedVariants = product.variants?.map((singleVariant) => ({
      ...singleVariant.dataValues,
      discount_percentage:
        singleVariant.discount_price && singleVariant.discount_price > 0
          ? calculateDiscountPercentage(
              singleVariant.price,
              singleVariant?.discount_price
            )
          : 0,
    }));

    // let discount_percentage = 0;

    // if (product.discount_price)
    //   discount_percentage = calculateDiscountPercentage(
    //     product.price,
    //     product.discount_price
    //   );

    res.status(200).json({
      success: true,
      data: {
        ...product.dataValues,
        variants: formatedVariants,
        // discount_percentage,
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
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      // price,
      // currency_price: NewproductCurrency,
      // discount_percentage,
      summary,
      // colors,
      // sizes,
      // stock,
      slug,
      // main_features,
      description,
      // kinds,
      model,
      category_id,
      brand_id,
      code,
      label,
      is_published,
      orderImages,
      variants,
      weight,
    } = req.body;

    // console.log(is_published);

    const { id } = req.params;

    const product = await Product.findByPk(id, { transaction });

    const productWeight = Number(weight) ? weight : product?.weight;

    const currency = await variables.findOne({
      where: { name: "currency" },
      transaction,
    });
    if (!currency) {
      transaction.rollback();
      res.status(404).json({ message: "cannot find currency", success: false });
      return;
    }
    const currentCurrency = +currency.value;

    if (!product) {
      transaction.rollback();
      res.status(404).json({ error: "Product not found." });
      return;
    }

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

    await product.update(
      {
        name,
        summary,
        description,
        model,
        category_id,
        brand_id,
        code,
        label,
        slug,
        is_published: is_published == "true",
        images: updatedImages,
        weight: productWeight,
      },
      { transaction }
    );

    if (variants) {
      for (const singleVariant of variants) {
        const {
          id,
          currency_price,
          color,
          discount_percentage,
          is_published,
          stock,
          kind,
          sku,
        } = singleVariant;
        // console.log("id :", id);
        if (!currency_price || !color || !stock) {
          res.status(400).json({
            message: "please enter full information for currency",
            success: false,
          });
          return;
        }
        let variantDiscountPrice = 0;
        const variantPrice = calculateIrPriceByCurrency(
          currency_price,
          currentCurrency
        );
        if (discount_percentage && discount_percentage > 0) {
          variantDiscountPrice = calculateDiscountPercentagePrice(
            variantPrice,
            discount_percentage
          );
        }
        if (Number(id)) {
          const targetVariant = await ProductVariants.findByPk(id);
          if (!targetVariant) {
            res.status(404).json({
              message: "cant find the product variant",
              success: false,
            });
            return;
          }
          await targetVariant.update(
            {
              color,
              kind,
              sku,
              product_id: product.id,
              currency_price,
              discount_price: variantDiscountPrice,
              is_published,
              price: variantPrice,
              stock,
            },
            { transaction }
          );
        } else {
          await ProductVariants.create(
            {
              color,
              kind,
              sku,
              product_id: product.id,
              currency_price,
              discount_price: variantDiscountPrice,
              is_published,
              price: variantPrice,
              stock,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

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
    await transaction.rollback();
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
    if (!product) {
      res.status(404).json({ message: "cannot found product", success: false });
      return;
    }
    // const targetEmbedding = await ProductEmbedding.findOne({
    //   where: { product_id: product.id },
    // });

    if (!product) {
      res.status(400).json({ success: false, message: "Product not found." });
      return;
    }

    product.images?.forEach((image) => deleteFile(image));
    await product.destroy();
    // await targetEmbedding?.destroy();

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

    const selectedProductEmbedding = await ProductEmbedding.findOne({
      where: { product_id: product.id },
    });

    // console.log(typeof selectedProductEmbedding?.embedding);
    if (!selectedProductEmbedding) {
      res
        .status(404)
        .json({ message: "cannot find embedding", success: false });
      return;
    }

    const formattedEmbedding = JSON.parse(selectedProductEmbedding.embedding);

    const foundProductsId = await ProductEmbedding.findAll({
      where: { id: { [Op.notIn]: [selectedProductEmbedding.id] } },
      order: [
        // [
        //   sequelize.literal(`embedding <=> '${JSON.stringify(inputVector)}'`),
        //   "ASC",
        // ],
        // Or with pgvector helper:
        // l2Distance("embedding", inputVector, sequelize),
        [
          sequelize.literal(
            `1 - (embedding <=> '${JSON.stringify(formattedEmbedding)}')`
          ),
          "DESC",
        ],
      ],
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
        { model: ProductVariants, as: "variants" },
      ],
    });

    const formatedProducts = foundProduct.map((p) => ({
      ...p.dataValues,
      images: p.images?.map((image) => formatedFileUrl(image)),
    }));

    res.status(200).json({ success: true, data: formatedProducts });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProductCategories = async (req: Request, res: Response) => {
  try {
    const includeProducts = req.query?.includeProducts == "true";
    const includeVariants = req.query?.includeVariants == "true";
    // console.log(req.query);
    let formatedData = [];

    const categories = await Categories.findAll({
      where: { parent_id: { [Op.is]: null as any } },
    });

    // const products = await Product.findAll({
    //   where: {
    //     category_id: {
    //       [Op.in]: [...categories.map((category) => category.id)],
    //     },
    //   },
    //   limit: 6,
    // });

    for (const category of categories) {
      const productsCategory = await Product.findAll({
        where: { category_id: category.id },
        // limit: 6,
        include: includeVariants
          ? [{ model: ProductVariants, as: "variants" }]
          : undefined,
      });

      if (productsCategory?.length)
        formatedData.push(
          includeProducts
            ? {
                categoryName: category.name,
                products: [
                  ...productsCategory.map((product) => ({
                    ...product.dataValues,
                    images: product.dataValues?.images?.map((image) =>
                      formatedFileUrl(image)
                    ),
                    ...(includeVariants ? {} : { variants: undefined }),
                  })),
                ],
              }
            : { categoryName: category.name }
        );
    }

    res.status(200).json({ success: true, data: formatedData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "server error" });
  }
};
