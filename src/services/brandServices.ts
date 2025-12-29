import {
  blogsAttributes,
  brandsAttributes,
  initModels,
} from "../models/init-models";
import { formattedDataUrl, pick } from "../utils/dataUtils";
import { AppError } from "../utils/error";
import { deleteFile, updateFile } from "../utils/fileUtils";

const Brands = initModels().brands;

export const createBrandService = async (
  data: blogsAttributes & { file: { path: string } }
) => {
  const { file } = data;
  // Check if a logo file was uploaded
  if (!file) {
    throw new AppError("provide a logo for brand", 400);
  }

  const logo_url = file.path.replace(/\\/g, "/"); // Path where the uploaded file is stored
  // Create the brand
  const newBrand = await Brands.create({
    ...pick(data, [
      "name",
      "website_url",
      "description",
      "english_name",
      "is_active",
    ]),
    logo_url,
    // Convert string "true"/"false" to boolean
  });
  return formattedDataUrl(newBrand.dataValues, "logo_url");
};

export const brandListService = async () => {
  const brands = await Brands.findAll();

  if (brands.length === 0) {
    return [];
  }

  const formatedBrands = brands.map((brand) =>
    formattedDataUrl(brand.dataValues, "logo_url")
  );

  return formatedBrands;
};

export const singleBrandService = async (brandId: string) => {
  // Validate the ID
  const parsedId = parseInt(brandId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid brand id", 400);
  }

  // Fetch the brand from the database
  const brand = await Brands.findByPk(parsedId);

  // Check if the brand exists
  if (!brand) {
    throw new AppError("brand not found", 404);
  }

  return formattedDataUrl(brand.dataValues, "logo_url");
};

export const singleBrandByNameService = async (brandName?: string) => {
  const brand = await Brands.findOne({
    where: { name: brandName },
  });

  // Check if the brand exists
  if (!brand) {
    throw new AppError("brand not found", 404);
  }

  return formattedDataUrl(brand.dataValues, "logo_url");
};

export const updateBrandService = async (
  brandId: string | number,
  data: brandsAttributes & { file: { path: string } }
) => {
  // Ensure the user is authenticated
  if (!brandId) {
    throw new AppError("provide brandId", 400);
  }

  const brand = await Brands.findByPk(brandId);

  if (!brand) {
    throw new AppError("brand not found", 404);
  }

  const { file } = data;

  // Handle file upload
  const newLogoPath = file ? file.path : undefined;
  const updatedLogoPath = await updateFile(newLogoPath, brand.logo_url);

  // Update the brand record
  await brand.update({
    ...pick(data, [
      "name",
      "english_name",
      "is_active", // Convert string to boolean if necessary
      "website_url",
      "description",
    ]),
    logo_url: updatedLogoPath,
  });
};

export const delteBrandService = async (brandId: string) => {
  const parsedId = parseInt(brandId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide valid brand id", 400);
  }

  // Find the brand in the database
  const brand = await Brands.findByPk(parsedId);
  if (!brand) {
    throw new AppError("brand not found", 404);
  }

  // Delete the logo file if it exists
  deleteFile(brand.logo_url);
  // Delete the brand from the database
  await brand.destroy();
};
