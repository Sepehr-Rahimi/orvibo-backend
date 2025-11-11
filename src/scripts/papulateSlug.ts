import { initModels } from "../models/init-models";
import { slugifyMixed } from "../utils/slugUtil";

const products = initModels().products;

const papulateSlug = async () => {
  try {
    const allProducts = await products.findAll();

    for (const product of allProducts) {
      const productSlug = slugifyMixed(product.name, { lower: true });

      // console.log(productSlug);

      await product.update({ slug: productSlug });

      console.log(`slug of ${product.name} updated`);
    }
  } catch (error) {
    console.log("error :", error);
  }
};

papulateSlug();
