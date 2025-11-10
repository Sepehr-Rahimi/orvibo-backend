export const formatedFileUrl = (filePath?: string) => {
  if (filePath) {
    const newFilePath = process.env.BASE_URL + filePath;
    return newFilePath.replace(/\\/g, "/");
  } else return "";
};

export const fileUrlToPath = (url?: string) => {
  if (url) {
    const newFilePath = url.replace(
      process.env.BASE_URL || "http://127.0.0.1:5000" || "",
      ""
    );
    return newFilePath;
  } else {
    return "";
  }
};
