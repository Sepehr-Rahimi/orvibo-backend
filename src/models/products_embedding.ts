import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { products, productsId } from './products';

export interface products_embeddingAttributes {
  id: number;
  product_id: number;
  embedding: any;
}

export type products_embeddingPk = "id";
export type products_embeddingId = products_embedding[products_embeddingPk];
export type products_embeddingOptionalAttributes = "id";
export type products_embeddingCreationAttributes = Optional<products_embeddingAttributes, products_embeddingOptionalAttributes>;

export class products_embedding extends Model<products_embeddingAttributes, products_embeddingCreationAttributes> implements products_embeddingAttributes {
  id!: number;
  product_id!: number;
  embedding!: any;

  // products_embedding belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof products_embedding {
    return products_embedding.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    embedding: {
      type: "vector",
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'products_embedding',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "fki_product_id",
        fields: [
          { name: "product_id" },
        ]
      },
      {
        name: "products_embedding_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
