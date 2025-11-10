import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface products_embeddingAttributes {
  id: number;
  product_id: number;
  embedding: string;
}

export type products_embeddingPk = "id";
export type products_embeddingId = products_embedding[products_embeddingPk];

export type productsEmbeddingOptionalAttributes = "id";
export type products_embeddingCreationAttributes = Optional<
  products_embeddingAttributes,
  productsEmbeddingOptionalAttributes
>;

export class products_embedding
  extends Model<
    products_embeddingAttributes,
    products_embeddingCreationAttributes
  >
  implements products_embeddingAttributes
{
  id!: number;
  product_id!: number;
  embedding!: string;

  static initModel(sequelize: Sequelize.Sequelize): typeof products_embedding {
    return products_embedding.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        embedding: {
          type: "VECTOR()",
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "products_embedding",
        schema: "public",
        timestamps: false,
        indexes: [
          {
            name: "products_embedding_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
