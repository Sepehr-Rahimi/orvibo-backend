import { NextFunction, Request, Response } from "express";

import {
  brandListService,
  createBrandService,
  delteBrandService,
  singleBrandByNameService,
  singleBrandService,
  updateBrandService,
} from "../services/brandServices";

export const createBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newBrand = await createBrandService({ ...req.body, file: req.file });

    res.status(201).json({
      message: "Brand created successfully",
      brand: newBrand,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const brandList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const brands = await brandListService();
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const singleBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const brand = await singleBrandService(id);

    // Return the brand details in the response
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

export const singleBrandByName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const brandName = decodeURIComponent(req.params?.name);

  try {
    // Fetch the brand from the database
    const brand = await singleBrandByNameService(brandName);

    // Return the brand details in the response
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const brand = await updateBrandService(id, { ...req.body, file: req.file });

    res.status(200).json({
      message: "اطلاعات کاربر با موفقیت ویرایش شد",
      brand,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Validate the ID
    const brand = await delteBrandService(id);

    res
      .status(200)
      .json({ success: true, message: "Brand deleted successfully." });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
