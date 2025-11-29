import path from "path";
import sequelize from "../config/database";
import fs from "fs";
import { initModels } from "../models/init-models";

const IMAGES_DIR = path.join(process.cwd(), "uploads/products/images");
const products = initModels().products;

async function cleanUpDuplicateImages() {
  try {
    sequelize.authenticate();
    console.log("connected to db");

    const allImagesInFolder = fs.readdirSync(IMAGES_DIR);
    console.log(`found ${allImagesInFolder.length} images`);

    const allProducts = await products.findAll();
    const usedImages = new Set<string>();

    allProducts.forEach((product) => {
      const productImages = product.images;
      if (!productImages) return;
      for (const img of productImages) {
        usedImages.add(path.basename(img));
      }
    });

    console.log(`${usedImages.size} images has found in db`);

    const unusedImages = allImagesInFolder.filter(
      (img) => !usedImages.has(img)
    );

    console.log(`found ${unusedImages.length} to not used`);

    for (const file of unusedImages) {
      const filePath = path.join(IMAGES_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`Removed: ${file}`);
    }

    console.log("Cleanup complete!");
  } catch (error) {
    console.log("we have an error", error);
  }
}

const compareFolderImagesWithDb = async () => {
  try {
    sequelize.authenticate();
    console.log("connected to db");

    const allImagesInFolder = fs.readdirSync(IMAGES_DIR);
    console.log(`found ${allImagesInFolder.length} images`);

    const allProducts = await products.findAll();

    // const usedImages = [];

    allProducts.forEach((product) => {
      const productImages = product.images;
      if (!productImages) return;

      for (const img of productImages) {
        // usedImages.push(path.basename(img));
        if (!allImagesInFolder.includes(path.basename(img))) {
          console.log(`${img} is not in folder`);
          console.log(`${product.name} its it`);
        }
      }
    });

    // console.log(`used images : ${usedImages.length}`);
  } catch (error) {
    console.log("error", error);
  }
};

compareFolderImagesWithDb();

// cleanUpDuplicateImages();
