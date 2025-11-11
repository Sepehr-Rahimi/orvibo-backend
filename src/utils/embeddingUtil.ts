import { initModels } from "../models/init-models";

import OpenAI from "openai";

import { formatedFileUrl } from "./fileUtils";
import sequelize from "../config/database";

const Category = initModels().categories;
const products = initModels().products;
const Brand = initModels().brands;
const productEmbedding = initModels().products_embedding;

export async function getEmbedding(text: string) {
  // const normalizeInput = normalizePersian(text);
  try {
    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // const prompt = `
    // You are an intelligent product search assistant for an online store.
    // Your job is to rewrite user queries into short, clear, product-style keywords.
    // The store has categories like: لوازم خودرو ,لوازم نطافت و بهداشت, لوازم خانه و آشپزخانه ,زیبایی و سلامت ,لوازم کمپ و سفر, لوازم الکترونیک ,اینترنت اشیا ,لوازم جانبی ,ابزار و دم دستی.

    // Example:
    // User: "یه دستگاهی که بتونم باهاش اسموتی درست کنم و سبک باشه ببرم سرکار"
    // Output: "مخلوط‌کن قابل حمل برای اسموتی"

    // User: "یه دستگاهی که بتونم همه جا باهاش قهوه داشته باشم"
    // Output: "قهوه ساز پرتابل"

    // User: "${text}"
    // Output:
    // `;
    // const prompt = `
    // You are an intelligent product search assistant for an online store that sells smart gadgets and electronic devices.

    // ONLY return relevant products from this category.

    // The store specializes in smart gadgets and tech-related categories:
    // The store has categories like: لوازم خودرو ,لوازم نطافت و بهداشت, لوازم خانه و آشپزخانه ,زیبایی و سلامت ,لوازم کمپ و سفر, لوازم الکترونیک ,اینترنت اشیا ,لوازم جانبی ,ابزار و دم دستی.

    // Example:
    // User: "یه دستگاهی که بتونم باهاش اسموتی درست کنم و سبک باشه ببرم سرکار"
    // Output: "مخلوط‌کن قابل حمل برای اسموتی"

    // User: "میخوام تصویر رو بندازم روی دیوار"
    // Output: "ویدیو پروژکتور"

    // User: "می‌خوام قاب عکس بخرم"
    // Output: "هیچ موردی یافت نشد"

    // User: "${text}"
    // Output:
    // `;

    const prompt = `
You are a smart e-commerce assistant for an online store that sells smart gadgets, tech devices, and electronic accessories.

Your task:
- Read the Persian user query.
- Understand what gadget or device they want.
- Translate and simplify it into a short, clear English phrase that represents the intended product.
- Focus on smart or electronic products (IoT, home devices, portable gadgets, etc.).

Guidelines:
- Translate meaning, not word-for-word.
- Keep it short (2–6 words).
- Do not include punctuation, quotes, or explanations.
- Prefer product or category names over descriptions.

Examples:
User: "یه دستگاهی که بتونم باهاش اسموتی درست کنم و سبک باشه ببرم سرکار"
Output: portable smoothie blender

User: "میخوام تصویر رو بندازم روی دیوار"
Output: video projector

User: "${text}"
Output:
`;

    const standardResponce = await openAi.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    console.log(standardResponce.choices[0]?.message?.content);

    const normalizeInput = standardResponce.choices[0]?.message?.content
      ? normalizePersian(standardResponce.choices[0]?.message?.content)
      : normalizePersian(text);

    const response = await openAi.embeddings.create({
      model: "text-embedding-3-small",
      input: normalizeInput,
    });

    const inputVector = response.data[0]?.embedding;

    const foundProducts = await products.findAll({
      include: [
        {
          model: productEmbedding,
          as: "productEmbedding",
          attributes: [],
        },
        {
          model: Category,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              `1 - (embedding <=> '${JSON.stringify(inputVector)}')`
            ),
            "similarity",
          ],
        ],
      },
      order: [
        // [
        //   sequelize.literal(`embedding <=> '${JSON.stringify(inputVector)}'`),
        //   "ASC",
        // ],
        // Or with pgvector helper:
        // l2Distance("embedding", inputVector, sequelize),
        // [
        //   sequelize.literal(
        //     `1 - (embedding <=> '${JSON.stringify(inputVector)}')`
        //   ),
        //   "DESC",
        // ],
        [sequelize.literal("similarity"), "DESC"],
      ],
      limit: 6,
      // raw: true,
    });

    const threshold = 0.01; // adjust if needed
    // console.log(foundProducts);
    const filteredProducts = foundProducts.filter(
      (p: any) => p.dataValues.similarity >= threshold
    );
    // console.log("result :", filteredProducts);

    const formatedProducts = filteredProducts.map((p) => ({
      ...p.dataValues,
      images: p.images?.map((image) => formatedFileUrl(image)),
      embedding: undefined,
    }));

    return formatedProducts;
  } catch (error) {
    console.error("Error in getEmbedding:", error);
    throw error;
  }
}

export const createProductEmbedding = async (text: string) => {
  try {
    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openAi.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const productEmbedding = response.data[0].embedding;
    return productEmbedding;
  } catch (error) {
    console.log(error);
  }
};

export const dataBaseEmbeddingFormat = (embedding: number[]) => {
  return `[${embedding.join(",")}]`;
};

export function normalizePersian(text: string) {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/[\n\r\t]+/g, " ")
    .trim();
}

// Cosine similarity function
// function cosineSimilarity(a: number[], b: number[]) {
//   const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
//   const normA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
//   const normB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
//   return dot / (normA * normB);
// }
