import { bannersAttributes, initModels } from "../models/init-models";
import { formattedDataUrl } from "../utils/dataUtils";
import { pick } from "../utils/dataUtils";
import { AppError } from "../utils/error";
import { deleteFile, updateFile } from "../utils/fileUtils";

const Banners = initModels().banners;

export const createBannerService = async (
  data: bannersAttributes & { file: { path: string } }
) => {
  const { file: bannerImage } = data;

  if (!bannerImage) {
    throw new AppError("لطفا عکس بنر را بارگذاری کنید", 400);
  }

  const cover = bannerImage.path.replace(/\\/g, "/");
  const newBanner = await Banners.create({
    ...pick(data, [
      "title",
      "description",
      "button_text",
      "link",
      "is_published",
    ]),
    cover,
  });

  return formattedDataUrl(newBanner.dataValues, "cover");
};

export const bannerListService = async () => {
  const banners = await Banners.findAll({
    where: {
      is_published: true,
    },
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  const formattedBanners = banners.map((banner) =>
    formattedDataUrl(banner.dataValues, "cover")
  );

  return formattedBanners;
};

export const adminBannerListService = async () => {
  const banners = await Banners.findAll();
  const formattedBanners = banners.map((banner) =>
    formattedDataUrl(banner.dataValues, "cover")
  );

  return formattedBanners;
};

export const singleBannerByIdService = async (bannerId: string) => {
  const parsedId = parseInt(bannerId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("invalid banner id", 400);
  }

  const banner = await Banners.findByPk(parsedId);
  if (!banner) {
    throw new AppError("بنر مورد نظر یافت نشد", 404);
  }

  return formattedDataUrl(banner.dataValues, "cover");
};

export const updateBannerService = async (
  bannerId: number | string,
  data: bannersAttributes & { file?: { path?: string } }
) => {
  if (!bannerId) {
    throw new AppError("banner id is require", 400);
  }

  const banner = await Banners.findByPk(bannerId);
  if (!banner) {
    throw new AppError("Banner not found", 404);
  }

  const { file } = data;

  const newCoverPath = file ? file.path : undefined;
  const updatedCoverPath = await updateFile(newCoverPath, banner.cover);

  await banner.update({
    ...pick(data, [
      "title",
      "description",
      "button_text",
      "link",
      "is_published",
    ]),
    cover: updatedCoverPath,
  });
};

export const deleteBannerService = async (bannerId: string) => {
  const parsedId = parseInt(bannerId, 10);
  if (isNaN(parsedId)) {
    throw new AppError("provide banner id ", 400);
  }

  const banner = await Banners.findByPk(parsedId);
  if (!banner) {
    throw new AppError("bnner not found", 404);
  }

  deleteFile(banner.cover);
  await banner.destroy();
};
