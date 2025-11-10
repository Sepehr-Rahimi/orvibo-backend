import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface categoriesAttributes {
  id: number;
  name: string;
  parent_id?: number | null;
  description?: string;
  image_url?: string;
}

export type categoriesPk = "id";
export type categoriesId = categories[categoriesPk];
export type categoriesOptionalAttributes =
  | "id"
  | "parent_id"
  | "description"
  | "image_url";
export type categoriesCreationAttributes = Optional<
  categoriesAttributes,
  categoriesOptionalAttributes
>;

export class categories
  extends Model<categoriesAttributes, categoriesCreationAttributes>
  implements categoriesAttributes
{
  id!: number;
  name!: string;
  parent_id?: number;
  description?: string;
  image_url?: string;

  static initModel(sequelize: Sequelize.Sequelize): typeof categories {
    return categories.init(
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
        parent_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        image_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "categories",
        schema: "public",

        indexes: [
          {
            name: "categories_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
