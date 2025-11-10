import fs from "fs";
import path from "path";

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
