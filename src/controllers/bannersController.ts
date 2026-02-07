import { NextFunction, Request, Response } from "express";
import {
  adminBannerListService,
  bannerListService,
  createBannerService,
  deleteBannerService,
  singleBannerByIdService,
  updateBannerService,
} from "../services/bannersServices";

export const createBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newBanner = await createBannerService({
      ...req.body,
      file: req.file,
    });

    res.status(201).json({
      message: "Banner created successfully",
      banner: newBanner,
    });
  } catch (error) {
    next(error);
  }
};

export const bannerList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const banners = await bannerListService();

    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

export const adminBannerList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const banners = await adminBannerListService();

    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

export const singleBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const banner = await singleBannerByIdService(id);

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const banner = await updateBannerService(id, {
      ...req.body,
      file: req.file,
    });
    res.status(200).json({ message: "Banner updated successfully", banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    await deleteBannerService(id);

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully." });
  } catch (error) {
    next(error);
  }
};
