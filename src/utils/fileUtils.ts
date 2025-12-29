import fs from "fs";
import path from "path";

export const updateFile = async (
  newFilePath: string | undefined,
  oldFilePath: string | undefined
): Promise<string> => {
  try {
    // If a new file is uploaded
    if (newFilePath) {
      // Delete the old file if it exists
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Return the path of the new file
      return newFilePath;
    }

    // If no new file is uploaded, keep the old file
    return oldFilePath || "";
  } catch (error) {
    console.error("Error handling file update:", error);
    throw new Error("Failed to update file.");
  }
};

/**
 * Deletes a file at the given path.
 * @param filePath - The absolute path to the file.
 * @returns A promise that resolves if the file is deleted successfully or rejects with an error.
 */
export const deleteFile = async (filePath?: string): Promise<void> => {
  if (filePath)
    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Delete the file
        await fs.promises.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error);
      throw new Error(`Unable to delete file: ${filePath}`);
    }
};

export const extractImages = (files: Express.Multer.File[] | unknown) =>
  Array.isArray(files)
    ? files.map((file: Express.Multer.File) => file.path.replace(/\\/g, "/"))
    : [];

export const formattedFileUrl = (filePath?: string) => {
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
