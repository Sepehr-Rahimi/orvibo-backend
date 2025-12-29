import { bannersAttributes } from "../models/banners";
import { formattedFileUrl } from "./fileUtils";

export const pick = (data: { [key: string]: any }, pick: string[]) => {
  return Object.fromEntries(
    pick
      .map((key) => [key, data[key]])
      .filter(([_, value]) => value !== undefined)
  );
};

export const formattedCover = (data: {
  [key: string]: any;
  cover?: string;
}) => ({
  ...data,
  cover: formattedFileUrl(data?.cover),
});
