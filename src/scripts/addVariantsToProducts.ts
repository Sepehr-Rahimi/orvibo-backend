import { initModels } from "../models/init-models";

const products = initModels().products;
const productsVariants = initModels().products_variants;

const mockVariants = (productId: number) => [
  {
    color: "#000000",
    stock: 3,
    currency_price: 4,
    price: 408000,
    product_id: productId,
  },
  {
    color: "#ffffff",
    stock: 3,
    currency_price: 5,
    price: 510000,
    product_id: productId,
  },
];

const addVariantsToProducts = async () => {
  const allProducts = await products.findAll();
  for (const product of allProducts) {
    await productsVariants.bulkCreate(mockVariants(product.id));
    console.log(`${product.name} is now have variant`);
  }
};

addVariantsToProducts();
