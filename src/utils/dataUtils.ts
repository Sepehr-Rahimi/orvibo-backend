import { bannersAttributes } from "../models/banners";
import { formattedFileUrl } from "./fileUtils";

export const pick = (data: { [key: string]: any }, pick: string[]) => {
  return Object.fromEntries(
    pick
      .map((key) => [key, data[key]])
      .filter(([_, value]) => value !== undefined)
  );
};

export const formattedDataUrl = <T extends Record<string, any>>(
  data: T,
  key: keyof T
): T => {
  const mustBeFormat = data?.[key];

  return {
    ...data,
    [key]: Array.isArray(mustBeFormat)
      ? mustBeFormat.map((singleFile: string) => formattedFileUrl(singleFile))
      : formattedFileUrl(mustBeFormat),
  };
};
