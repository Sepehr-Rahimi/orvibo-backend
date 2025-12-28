import { bannersAttributes } from "../models/banners";
import { formatedFileUrl } from "./fileUtils";

export const formattedBanner = (bannerData: bannersAttributes) => ({
  ...bannerData,
  cover: formatedFileUrl(bannerData.cover),
});
