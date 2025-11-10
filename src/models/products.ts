import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface productsAttributes {
  id: number;
  name: string;
  price: number;
  discount_price?: number;
  summary?: string;
  colors?: string[];
  sizes?: string[];
  stock: number;
  images: string[];
  main_features?: string[];
  description?: string;
  kinds?: string[];
  model?: string;
  category_id?: number;
  brand_id?: number;
  code?: string;
  label?: string;
  is_published?: boolean;
  // embedding?: number[] | null;
  embedding_id?: number;
  currency_price?: number;
  created_at?: Date;
}

export type productsPk = "id";
export type productsId = products[productsPk];
export type productsOptionalAttributes =
  | "id"
  | "discount_price"
  | "summary"
  | "colors"
  | "sizes"
  | "stock"
  | "images"
  | "main_features"
  | "description"
  | "kinds"
  | "model"
  | "category_id"
  | "brand_id"
  | "code"
  | "label"
  | "is_published"
  // | "embedding"
  | "embedding_id"
  | "currency_price"
  | "created_at";
export type productsCreationAttributes = Optional<
  productsAttributes,
  productsOptionalAttributes
>;

export class products
  extends Model<productsAttributes, productsCreationAttributes>
  implements productsAttributes
{
  [x: string]: any;
  id!: number;
  name!: string;
  price!: number;
  discount_price?: number;
  summary?: string;
  colors?: string[];
  sizes?: string[];
  stock!: number;
  images!: string[];
  main_features?: string[];
  description?: string;
  kinds?: string[];
  model?: string;
  category_id?: number;
  brand_id?: number;
  code?: string;
  label?: string;
  is_published?: boolean;
  // embedding?: number[];
  embedding_id?: number;
  currency_price?: number;
  created_at!: Date;

  static associate(models: any) {
    this.belongsTo(models.categories, {
      foreignKey: "category_id",
      as: "category",
    });
    this.belongsTo(models.brands, {
      foreignKey: "brand_id",
      as: "brand",
    });
    this.belongsTo(models.products_embedding, {
      foreignKey: "embedding_id",
      as: "productEmbedding",
    });
  }

  static initModel(sequelize: Sequelize.Sequelize): typeof products {
    return products.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        discount_price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        summary: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        colors: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: true,
        },
        sizes: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: true,
        },
        stock: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        images: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: true,
          defaultValue: [],
        },
        main_features: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        kinds: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: true,
        },
        model: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        brand_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        code: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        label: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        is_published: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        // embedding: {
        //   type: DataTypes.ARRAY(DataTypes.FLOAT),
        //   allowNull: true,
        // },
        embedding_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        currency_price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "products",
        schema: "public",
        indexes: [
          {
            name: "products_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
        // defaultScope: {
        //   attributes: { exclude: ["embedding"] },
        // },
        // scopes: {
        //   withEmbedding: {
        //     attributes: { include: ["embedding"] },
        //   },
        // },
      }
    );
  }
}
