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
