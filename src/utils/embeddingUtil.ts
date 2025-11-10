import axios from "axios";
import { initModels } from "../models/init-models";
import {
  matchEmbeddingToProducts,
  // matchEmbeddingToProducts,
  normalizePersian,
  setEmbeddingToProducts,
} from "../scripts/papulateEmbeddings";
import similarity from "compute-cosine-similarity";
import { InferenceClient } from "@huggingface/inference";
import OpenAI from "openai";

import { formatedFileUrl } from "./formatedFileUrl";
import { l2Distance } from "pgvector/sequelize";
import sequelize from "../config/database";
import { Op } from "sequelize";

const Category = initModels().categories;
const products = initModels().products;
const Brand = initModels().brands;
const productEmbedding = initModels().products_embedding;

export async function getEmbedding(text: string) {
  // await setEmbeddingToProducts();
  // await matchEmbeddingToProducts();
  // const allProducts = await products.findAll({
  //   include: [
  //     {
  //       model: Category,
  //       as: "category",
  //     },
  //     {
  //       model: Brand,
  //       as: "brand",
  //     },
  //     {
  //       model: productEmbedding,
  //       as: "productEmbedding",
  //     },
  //   ],
  // });
  // console.log(allProducts);
  const normalizeInput = normalizePersian(text);
  try {
    // console.log("fething data");
    // const res = await axios.post(
    //   "https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/sentence-similarity",
    //   {
    //     inputs: [`sentence : ${normalizeInput}`],
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );
    const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openAi.embeddings.create({
      model: "text-embedding-3-small",
      input: normalizeInput,
    });
    // const response = await client.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: "Hello world!",
    // });
    //   // console.log(response.data[0].embedding);

    const inputVector = response.data[0]?.embedding;
    //   console.log(inputVector);
    //   // console.log("matching products");
    // const results = allProducts.map((product) => {
    //   const productEmbedding = product.productEmbedding?.embedding ?? [];
    //   if (productEmbedding?.length !== inputVector.length) return null;
    //   return {
    //     ...product.toJSON(),
    //     // formated images url to send them with http://...
    //     images: product.images?.map((image) => formatedFileUrl(image)),
    //     similarityScore: similarity(inputVector, productEmbedding),
    //   };
    // });
    //   console.log("sorting products");
    //   console.log(results);
    // const machedResault = results
    //   .sort((a, b) => {
    //     const bSimilarity = b?.similarityScore ?? 0;
    //     const aSimilarity = a?.similarityScore ?? 0;
    //     return bSimilarity - aSimilarity;
    //   })
    //   .filter((prod) => prod?.similarityScore && prod?.similarityScore > 0.75)
    //   .slice(0, 6);
    // return [];

    // const foundProductsId = await productEmbedding.findAll({
    //   order: l2Distance("embedding", inputVector, sequelize),
    //   limit: 6,
    //   attributes: ["id", "product_id"],
    // });

    // const foundProduct = await products.findAll({
    //   where: { id: foundProductsId.map((p) => p.product_id) },
    //   include: [
    //     {
    //       model: Category,
    //       as: "category",
    //     },
    //     {
    //       model: Brand,
    //       as: "brand",
    //     },
    //   ],
    // });

    const foundProducts = await products.findAll({
      include: [
        {
          model: productEmbedding,
          as: "productEmbedding", // make sure association exists
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
      order: [
        // Order by L2 distance
        // [sequelize.literal(`embedding.embedding <-> '${inputVector}'`), "ASC"],
        // Or with pgvector helper:
        l2Distance("embedding", inputVector, sequelize),
      ],
      limit: 6,
    });

    const formatedProducts = foundProducts.map((p) => ({
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
    // const res = await axios.post(
    //   "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large/pipeline/feature-extraction",
    //   { inputs: [`passage : ${text}`] },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

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

// Cosine similarity function
// function cosineSimilarity(a: number[], b: number[]) {
//   const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
//   const normA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
//   const normB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
//   return dot / (normA * normB);
// }
