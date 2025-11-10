import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { formatedFileUrl } from "../utils/formatedFileUrl";
import { updateFile } from "../utils/updateFile";
import { deleteFile } from "../utils/deleteFile";

const Brand = initModels().brands;

export const createBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, website_url, description, english_name, is_active } =
      req.body;

    // Check if a logo file was uploaded
    if (!req.file) {
      res.status(400).json({ error: "Logo file is required." });
      return;
    }

    const logo_url = req.file.path.replace(/\\/g, "/"); // Path where the uploaded file is stored
    // Create the brand
    const newBrand = await Brand.create({
      name,
      logo_url,
      website_url,
      description,
      english_name,
      is_active: is_active === "true", // Convert string "true"/"false" to boolean
    });

    res.status(201).json({
      message: "Brand created successfully",
      brand: {
        ...newBrand.dataValues,
        logo_url: formatedFileUrl(newBrand.logo_url),
      },
    });
    return;
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const brandList = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all brands from the database
    const brands = await Brand.findAll();

    const formatedBrands = brands.map((brand) => {
      return {
        ...brand.dataValues,
        logo_url: formatedFileUrl(brand.logo_url),
      };
    });

    // Check if there are no brands found
    if (brands.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    // Return the list of brands in the response
    res.status(200).json({ success: true, data: formatedBrands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const singleBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid brand ID." });
      return;
    }

    // Fetch the brand from the database
    const brand = await Brand.findByPk(parsedId);

    // Check if the brand exists
    if (!brand) {
      res.status(400).json({ success: false, message: "Brand not found." });
      return;
    }

    // Return the brand details in the response
    res.status(200).json({
      success: true,
      data: {
        ...brand.dataValues,
        logo_url: formatedFileUrl(brand.logo_url),
      },
    });
  } catch (error) {
    console.error("Error fetching brand:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const singleBrandByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name } = req.params;

  try {
    // Fetch the brand from the database
    const brand = await Brand.findOne({
      where: { name: decodeURIComponent(name) },
    });

    // Check if the brand exists
    if (!brand) {
      res.status(400).json({ success: false, message: "Brand not found." });
      return;
    }

    // Return the brand details in the response
    res.status(200).json({
      success: true,
      data: {
        ...brand.dataValues,
        logo_url: formatedFileUrl(brand.logo_url),
      },
    });
  } catch (error) {
    console.error("Error fetching brand:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, website_url, description, english_name, is_active } =
      req.body;

    const { id } = req.params;

    // Ensure the user is authenticated
    if (!id) {
      res.status(401).json({ error: "کاربری پیدا نشد" });
      return;
    }

    const brand = await Brand.findByPk(id);

    if (!brand) {
      res.status(404).json({ error: "کاربری پیدا نشده" });
      return;
    }

    // Update user fields

    // Handle file upload
    const newLogoPath = req.file ? req.file.path : undefined;
    const updatedLogoPath = await updateFile(newLogoPath, brand.logo_url);

    // Update the brand record
    await brand.update({
      name,
      english_name,
      is_active: is_active === "true", // Convert string to boolean if necessary
      logo_url: updatedLogoPath,
      website_url,
      description,
    });

    res.status(200).json({
      message: "اطلاعات کاربر با موفقیت ویرایش شد",
      brand,
    });
    return;
  } catch (error) {
    console.error("Error fetching brand:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
export const deleteBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid brand ID." });
      return;
    }

    // Find the brand in the database
    const brand = await Brand.findByPk(parsedId);
    if (!brand) {
      res.status(404).json({ success: false, message: "Brand not found." });
      return;
    }

    // Delete the logo file if it exists
    deleteFile(brand.logo_url);
    // Delete the brand from the database
    await brand.destroy();

    res
      .status(200)
      .json({ success: true, message: "Brand deleted successfully." });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
