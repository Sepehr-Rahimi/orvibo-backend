import { Op } from "sequelize";
import {
  initModels,
  products,
  products_variants,
  products_variantsAttributes,
  productsCreationAttributes,
} from "../models/init-models";
import { getChildCategories } from "../utils/categoryUtils";
import { formattedDataUrl, pick } from "../utils/dataUtils";
import { AppError } from "../utils/error";
import {
  deleteFile,
  extractImages,
  fileUrlToPath,
  formattedFileUrl,
} from "../utils/fileUtils";
import {
  calculateDiscountPercentage,
  calculateDiscountPercentagePrice,
  calculateIrPriceByCurrency,
} from "../utils/mathUtils";
import * as variablesServices from "./variablesServices";
import * as categoryServices from "./categoryServices";
import * as brandServices from "./brandServices";
import * as productVariantsServices from "./productVariantsServices";
import paginationUtil from "../utils/paginationUtil";
import { formatVariants, orderingProductImages } from "../utils/productUtils";
import sequelize from "sequelize";

const Products = initModels().products;
const Categories = initModels().categories;
const Brands = initModels().brands;
const ProductVariants = initModels().products_variants;
const ProductEmbedding = initModels().products_embedding;

interface productCreateRequest extends productsCreationAttributes {
  variants: (products_variantsAttributes & { discount_percentage: number })[];
  files: Express.Multer.File[];
}

interface productUpdateRequest extends productCreateRequest {
  orderImages: string[];
}

interface productWithVariants extends products {
  variants?: products_variants[];
}

export const createProductService = async (data: productCreateRequest) => {
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
    files,
  } = data;

  // Handle images
  const images = extractImages(files);

  const currency = await variablesServices.getVariableByName("currency");

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

  const newProduct = await Products.create(
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
      is_published,
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
      throw new AppError("please provide all variants info", 400);
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

  return formattedDataUrl(newProduct.dataValues, "images");
  // await transaction?.commit();
};

export const productListService = async (params: { [key: string]: any }) => {
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
    const selectedCategory = await categoryServices.singleCategoryByNameService(
      categoryName
    );

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
    const selectedBrand = await brandServices.singleBrandByNameService(
      brandName
    );

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

  const { rows: products, count: total } = await Products.findAndCountAll({
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
        model: Brands,
        as: "brand",
      },
      {
        model: ProductVariants,
        as: "variants",
        separate: true,
      },
    ],
  });

  const formattedProducts = products.map((product) =>
    formattedDataUrl(product.dataValues, "images")
  );

  return formattedProducts;
};

export const adminProductListService = async (params: {
  page?: string;
  limit?: string;
  [key: string]: any;
}) => {
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

  const paginate = paginationUtil(params);
  // console.log("pagination is : ", paginate);

  const { rows: products, count: total } = await Products.findAndCountAll({
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
        model: Brands,
        as: "brand",
      },
      {
        model: ProductVariants,
        as: "variants",
        separate: true,
      },
    ],
  });

  const formattedProducts = products.map(
    (product) => formattedDataUrl(product.dataValues, "images")

    // let discount_percentage = 0;
    // if (product.discount_price) {
    //   discount_percentage = calculateDiscountPercentage(
    //     product.price,
    //     product.discount_price
    //   );
    // }
  );

  return {
    products: formattedProducts,
    pagination: paginate && {
      page: paginate.page,
      limit: paginate.limit,
      total,
      hasMore: paginate.offset + formattedProducts.length < total,
    },
  };
};

export const searchProductService = async (params: {
  page?: string;
  limit?: string;
  [key: string]: any;
}) => {
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

  const paginate = paginationUtil(params);

  const { rows: products, count: total } = await Products.findAndCountAll({
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
        model: Brands,
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
    images: product.images?.map((image) => formattedFileUrl(image)),
  }));

  return {
    products: formattedProducts,
    pagination: paginate && {
      page: paginate.page,
      limit: paginate.limit,
      total,
      hasMore: paginate.offset + formattedProducts.length < total,
    },
  };
};

export const singleProductByNameService = async (name: string) => {
  const product = await Products.findOne({
    where: {
      name: decodeURIComponent(name),
    },
    include: [
      {
        model: Categories,
        as: "category",
      },
      {
        model: Brands,
        as: "brand",
      },
      { model: ProductVariants, as: "variants" },
    ],
  });
  if (!product) {
    throw new AppError("محصول مورد نظر پیدا نشد", 404);
  }

  if (!product.is_published) {
    throw new AppError("این محصول هنوز منتشر نشده", 403);
  }

  return formattedDataUrl(product.dataValues, "images");
};

export const singleProductBySlugService = async (slug: string) => {
  if (!slug) {
    throw new AppError("provide product slug", 400);
  }
  const product: productWithVariants | null = await Products.findOne({
    where: { slug },
    include: [
      {
        model: Categories,
        as: "category",
      },
      {
        model: Brands,
        as: "brand",
      },
      {
        model: ProductVariants,
        as: "variants",
      },
    ],
  });

  if (!product) {
    throw new AppError("محصول مورد نظر یافت نشد", 404);
  }

  if (!product.is_published) {
    throw new AppError("محصول مورد نظر هنوز منتشر نشده", 403);
  }

  const dollarToIrrRecord = await variablesServices.getVariableByName(
    "usdToIrr"
  );

  const dollarToIrrExchange = +dollarToIrrRecord.value;
  const formattedProduct = {
    ...formattedDataUrl(product.dataValues, "images"),
    variants: product.variants
      ? formatVariants(dollarToIrrExchange, product?.variants)
      : undefined,
  };

  return formattedProduct;
};

export const singleProductByIdService = async (productId: string) => {
  const parsedId = parseInt(productId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid product id", 400);
  }

  const product = await Products.findByPk(parsedId, {
    include: [
      {
        model: Categories,
        as: "category",
      },
      {
        model: Brands,
        as: "brand",
      },
      {
        model: ProductVariants,
        as: "variants",
      },
    ],
  });
  if (!product) {
    throw new AppError("محصول مورد نظر یافت نشد", 404);
  }

  if (!product.is_published) {
    throw new AppError("محصول مورد نظر هنوز منتشر نشده", 403);
  }

  // let discount_percentage = 0;
  // if (product.discount_price) {
  //   discount_percentage = calculateDiscountPercentage(
  //     product.price,
  //     product.discount_price
  //   );
  // }

  return formattedDataUrl(product.dataValues, "images");
};

export const adminSingleProductByIdService = async (productId: string) => {
  const parsedId = parseInt(productId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid product id", 400);
  }

  const product: productWithVariants | null = await Products.findByPk(
    parsedId,
    {
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brands,
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
    throw new AppError("product not found", 404);
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

  return {
    ...formattedDataUrl(product.dataValues, "images"),
    variants: formatedVariants,
    // discount_percentage,
  };
};

export const updateProductService = async (
  productId: number | string,
  data: productUpdateRequest
) => {
  const transaction = await Products.sequelize?.transaction();
  try {
    const { slug, orderImages, variants, weight } = data;

    // console.log(is_published);

    const product = await Products.findByPk(productId, { transaction });

    const productWeight = Number(weight) ? weight : product?.weight;

    const currency = await variablesServices.getVariableByName("currency");

    const currentCurrency = +currency.value;

    if (!product) {
      throw new AppError("cannot find product ", 404);
    }

    const bodyImages = data.images; // could be string or array

    const files = data.files as Express.Multer.File[];

    const allImages = orderingProductImages(bodyImages, orderImages, files);

    // console.log(files);

    // Rebuild the array in the same order

    const updatedImages = allImages.length > 0 ? allImages : product.images;

    await product.update(
      {
        ...pick(data, [
          "name",
          "summary",
          "description",
          "model",
          "category_id",
          "brand_id",
          "code",
          "label",
          "is_published",
        ]),
        slug,
        images: updatedImages,
        weight: productWeight,
      },
      { transaction }
    );

    if (variants) {
      for (const singleVariant of variants) {
        const { id, currency_price, color, discount_percentage, stock } =
          singleVariant;
        // console.log("id :", id);
        if (!currency_price || !color || !stock) {
          throw new AppError("provide all variants information", 400);
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
          const targetVariant = await ProductVariants.update(
            {
              ...pick(singleVariant, ["kind", "sku", "is_published"]),
              color,
              product_id: product.id,
              currency_price,
              discount_price: variantDiscountPrice,
              price: variantPrice,
              stock,
            },
            { where: { id }, transaction }
          );
        } else {
          await ProductVariants.create(
            {
              ...pick(singleVariant, ["kind", "sku", "is_published"]),
              color,
              product_id: product.id,
              currency_price,
              discount_price: variantDiscountPrice,
              price: variantPrice,
              stock,
            },
            { transaction }
          );
        }
      }
    }

    await transaction?.commit();
    return formattedDataUrl(product.dataValues, "images");
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
};

export const deleteProductImagesService = async (
  productId: string,
  images: string[]
) => {
  const product = await Products.findByPk(productId);
  if (!product) {
    throw new AppError("cannot find product", 404);
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
};

export const deleteProductService = async (productId: string) => {
  const parsedId = parseInt(productId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid product id", 400);
  }

  const product = await Products.findByPk(parsedId);
  if (!product) {
    throw new AppError("cannot find product", 404);
  }
  // const targetEmbedding = await ProductEmbedding.findOne({
  //   where: { product_id: product.id },
  // });

  product.images?.forEach((image) => deleteFile(image));
  await product.destroy();
  // await targetEmbedding?.destroy();
};

export const similarProductsService = async (productId?: string) => {
  if (!productId || typeof productId !== "string") {
    throw new AppError("provide valid id", 400);
  }
  const parsedId = parseInt(productId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid id", 400);
  }
  const product = await Products.findByPk(parsedId, {
    // include: [{ model: ProductEmbedding, as: "productEmbedding" }],
  });
  if (!product) {
    throw new AppError("cannot find product", 404);
  }

  const selectedProductEmbedding = await ProductEmbedding.findOne({
    where: { product_id: product.id },
  });

  // console.log(typeof selectedProductEmbedding?.embedding);
  if (!selectedProductEmbedding) {
    throw new AppError("cannot find product embedding", 404);
  }

  const formattedEmbedding = JSON.parse(selectedProductEmbedding.embedding);

  const foundProductsId = await ProductEmbedding.findAll({
    where: { id: { [Op.notIn]: [selectedProductEmbedding.id] } },
    order: [
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

  const foundProduct = await Products.findAll({
    where: {
      id: foundProductsId.map(
        (p: { product_id: string | number }) => p.product_id
      ),
    },
    include: [
      {
        model: Categories,
        as: "category",
      },
      {
        model: Brands,
        as: "brand",
      },
      { model: ProductVariants, as: "variants" },
    ],
  });

  const formatedProducts = foundProduct.map((p) => ({
    ...p.dataValues,
    images: p.images?.map((image) => formattedFileUrl(image)),
  }));

  return formatedProducts;
};

export const getProductCategoriesService = async (query: {
  includeProducts?: string;
  includeVariants?: string;
}) => {
  const includeProducts = query?.includeProducts == "true";
  const includeVariants = query?.includeVariants == "true";
  let formattedData = [];

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
    const productsCategory = await Products.findAll({
      where: { category_id: category.id },
      // limit: 6,
      include: includeVariants
        ? [{ model: ProductVariants, as: "variants" }]
        : undefined,
    });

    if (productsCategory?.length)
      formattedData.push(
        includeProducts
          ? {
              categoryName: category.name,
              products: [
                ...productsCategory.map((product) => ({
                  ...formattedDataUrl(product.dataValues, "images"),
                  ...(includeVariants ? {} : { variants: undefined }),
                })),
              ],
            }
          : { categoryName: category.name }
      );
  }

  return formattedData;
};
