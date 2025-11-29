import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface bannersAttributes {
  id: number;
  title?: string;
  description?: string;
  button_text?: string;
  link?: string;
  cover: string;
  created_at?: Date;
  is_published?: boolean;
}

export type bannersPk = "id";
export type bannersId = banners[bannersPk];
export type bannersOptionalAttributes =
  | "id"
  | "description"
  | "button_text"
  | "link"
  | "created_at"
  | "is_published";
export type bannersCreationAttributes = Optional<
  bannersAttributes,
  bannersOptionalAttributes
>;

export class banners
  extends Model<bannersAttributes, bannersCreationAttributes>
  implements bannersAttributes
{
  id!: number;
  title?: string;
  description?: string;
  button_text?: string;
  link?: string;
  cover!: string;
  created_at?: Date;
  is_published?: boolean;

  static initModel(sequelize: Sequelize.Sequelize): typeof banners {
    return banners.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        button_text: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        link: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        cover: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        is_published: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: "banners",
        schema: "public",
        timestamps: true,
        indexes: [
          {
            name: "banners_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
