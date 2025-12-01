import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { formatedFileUrl } from "../utils/fileUtils";
import { updateFile } from "../utils/fileUtils";
import { deleteFile } from "../utils/fileUtils";

const Banner = initModels().banners;

export const createBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, description, button_text, link, is_published } = req.body;

    if (!req.file) {
      res.status(400).json({ error: "Cover image is required." });
      return;
    }

    const cover = req.file.path.replace(/\\/g, "/");
    const newBanner = await Banner.create({
      title,
      description,
      button_text,
      link,
      cover,
      is_published,
    });

    res.status(201).json({
      message: "Banner created successfully",
      banner: {
        ...newBanner.dataValues,
        cover: formatedFileUrl(newBanner.cover),
      },
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const bannerList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banners = await Banner.findAll({
      where: {
        is_published: true,
      },
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
    });
    const formattedBanners = banners.map((banner) => ({
      ...banner.dataValues,
      cover: formatedFileUrl(banner.cover),
    }));

    res.status(200).json({ success: true, data: formattedBanners });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminBannerList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banners = await Banner.findAll();
    const formattedBanners = banners.map((banner) => ({
      ...banner.dataValues,
      cover: formatedFileUrl(banner.cover),
    }));

    res.status(200).json({ success: true, data: formattedBanners });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const singleBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid banner ID." });
      return;
    }

    const banner = await Banner.findByPk(parsedId);
    if (!banner) {
      res.status(404).json({ success: false, message: "Banner not found." });
      return;
    }

    res.status(200).json({
      success: true,
      data: { ...banner.dataValues, cover: formatedFileUrl(banner.cover) },
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, description, button_text, link, is_published } = req.body;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Banner ID is required" });
      return;
    }

    const banner = await Banner.findByPk(id);
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }

    const newCoverPath = req.file ? req.file.path : undefined;
    const updatedCoverPath = await updateFile(newCoverPath, banner.cover);

    await banner.update({
      title,
      description,
      button_text,
      link,
      is_published,
      cover: updatedCoverPath,
    });

    res.status(200).json({ message: "Banner updated successfully", banner });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const deleteBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: "Invalid banner ID." });
      return;
    }

    const banner = await Banner.findByPk(parsedId);
    if (!banner) {
      res.status(404).json({ success: false, message: "Banner not found." });
      return;
    }

    deleteFile(banner.cover);
    await banner.destroy();

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully." });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
