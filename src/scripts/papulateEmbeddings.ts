import axios from "axios";
import { initModels } from "../models/init-models";
import OpenAI from "openai";

const products = initModels().products;
const embedding = initModels().products_embedding;

export function normalizePersian(text: string) {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/[\n\r\t]+/g, " ")
    .trim();
}

export async function setEmbeddingToProducts() {
  const items = await products.findAll({});

  const sources = items.map((prod) =>
    normalizePersian(
      `${prod.name}` + ` - ${prod.summary ?? ""} - ${prod.description ?? ""}`
    )
  );

  try {
    // const res = await axios.post(
    //   "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large/pipeline/feature-extraction",
    //   { inputs: sources },
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
      input: sources,
    });

    const embeddings = response.data;

    if (!Array.isArray(embeddings) || embeddings.length !== items.length) {
      throw new Error("Mismatch between embeddings and products.");
    }

    for (let i = 0; i < items.length; i++) {
      const alreadyEmbed = await embedding.findOne({
        where: { product_id: items[i].id },
      });

      const formatedEmbedding = `[${embeddings[i].embedding.join(",")}]`;
      if (alreadyEmbed) {
        await alreadyEmbed.update({ embedding: formatedEmbedding });
      } else {
        await embedding.create({
          embedding: formatedEmbedding,
          product_id: items[i].id,
        });
      }
      console.log(`Updated product ${items[i].id}`);
    }
  } catch (err: any) {
    console.error("Embedding batch failed:", err.message);
  }
}

// setEmbeddingToProducts();

export async function matchEmbeddingToProducts() {
  // const allProducts = await products.findAll();
  const productsEmbedding = await embedding.findAll();

  productsEmbedding.map(async (singleEmbed) => {
    const targetProduct = await products.findByPk(singleEmbed.product_id);
    await targetProduct?.update({ embedding_id: singleEmbed.id });
    console.log(`product ${targetProduct?.name} updated`);
  });
}
