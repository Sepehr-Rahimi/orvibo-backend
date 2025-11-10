import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface brandsAttributes {
  id: number;
  name: string;
  is_active: boolean;
  logo_url?: string;
  website_url?: string;
  description?: string;
  english_name?: string;
}

export type brandsPk = "id";
export type brandsId = brands[brandsPk];
export type brandsOptionalAttributes =
  | "id"
  | "logo_url"
  | "website_url"
  | "description";
export type brandsCreationAttributes = Optional<
  brandsAttributes,
  brandsOptionalAttributes
>;

export class brands
  extends Model<brandsAttributes, brandsCreationAttributes>
  implements brandsAttributes
{
  id!: number;
  name!: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  is_active!: boolean;
  english_name?: string;

  static initModel(sequelize: Sequelize.Sequelize): typeof brands {
    return brands.init(
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
        english_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        logo_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        website_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "brands",
        schema: "public",

        indexes: [
          {
            name: "brands_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
