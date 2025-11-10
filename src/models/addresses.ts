import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface addressesAttributes {
  id: number;
  user_id: number;
  is_home?: boolean;
  full_name: string;
  phone_number: string;
  address: string;
  city: string;
  province: string;
  zipcode?: string;
  is_default?: boolean;
}

export type addressesPk = "id";
export type addressesId = addresses[addressesPk];
export type addressesOptionalAttributes =
  | "id"
  | "is_home"
  | "zipcode"
  | "is_default";
export type addressesCreationAttributes = Optional<
  addressesAttributes,
  addressesOptionalAttributes
>;

export class addresses
  extends Model<addressesAttributes, addressesCreationAttributes>
  implements addressesAttributes
{
  id!: number;
  user_id!: number;
  is_home?: boolean;
  full_name!: string;
  phone_number!: string;
  address!: string;
  city!: string;
  province!: string;
  zipcode?: string;
  is_default?: boolean;

  static initModel(sequelize: Sequelize.Sequelize): typeof addresses {
    return addresses.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        is_home: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        full_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        province: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        zipcode: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        is_default: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: "addresses",
        schema: "public",

        indexes: [
          {
            name: "addresses_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
