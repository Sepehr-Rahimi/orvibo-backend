// import cron from "node-cron";
// import { initModels } from "../models/init-models";
// import { calculateDiscountPercentagePrice } from "../utils/mathUtils";
// import sequelize from "../config/database";
// import { Op } from "sequelize";

// const products = initModels().products;

// console.log("Cron setup starting:", new Date().toLocaleString("fa-IR"));

// const discountCron = cron.schedule(
//   "0 0 * * *",
//   async () => {
//     console.log("change featured products...");
//     try {
//       const newFeaturedProducts = await products.findAll({
//         where: {
//           // brandId:42 = tuya
//           brand_id: 42,
//           is_published: true,
//           stock: { [Op.gt]: 0 },
//         },
//         order: sequelize.literal("RANDOM()"),
//         limit: 4,
//       });

//       const oldFeaturedProducts = await products.findAll({
//         where: { label: "تخفیف روز" },
//       });

//       for (const oldFeaturedProduct of oldFeaturedProducts) {
//         await oldFeaturedProduct.update({ label: "", discount_price: 0 });
//         console.log(`${oldFeaturedProduct} is removed from features`);
//       }

//       for (const featuredProduct of newFeaturedProducts) {
//         const discountPercentage = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
//         const featuredProductDiscountPrice = calculateDiscountPercentagePrice(
//           featuredProduct.price,
//           discountPercentage
//         );
//         await featuredProduct.update({
//           label: "تخفیف روز",
//           discount_price: featuredProductDiscountPrice,
//         });
//         console.log(`${featuredProduct.name} is featured`);
//       }

//       console.log("work is done");
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   { timezone: "Asia/Tehran" }
// );

// console.log(discountCron);
