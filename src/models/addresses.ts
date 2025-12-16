import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { orders, ordersId } from "./orders";
import type { users, usersId } from "./users";

export interface addressesAttributes {
  id: number;
  user_id: number;
  is_home?: boolean;
  full_name: string;
  latin_full_name: string;
  phone_number: string;
  address: string;
  city: string;
  province: string;
  zipcode?: string;
  is_default?: boolean;
  created_at?: Date;
}

export type addressesPk = "id";
export type addressesId = addresses[addressesPk];
export type addressesOptionalAttributes =
  | "id"
  | "is_home"
  | "zipcode"
  | "is_default"
  | "created_at";
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
  latin_full_name!: string;
  phone_number!: string;
  address!: string;
  city!: string;
  province!: string;
  zipcode?: string;
  is_default?: boolean;
  created_at?: Date;

  // addresses hasMany orders via address_id
  orders!: orders[];
  getOrders!: Sequelize.HasManyGetAssociationsMixin<orders>;
  setOrders!: Sequelize.HasManySetAssociationsMixin<orders, ordersId>;
  addOrder!: Sequelize.HasManyAddAssociationMixin<orders, ordersId>;
  addOrders!: Sequelize.HasManyAddAssociationsMixin<orders, ordersId>;
  createOrder!: Sequelize.HasManyCreateAssociationMixin<orders>;
  removeOrder!: Sequelize.HasManyRemoveAssociationMixin<orders, ordersId>;
  removeOrders!: Sequelize.HasManyRemoveAssociationsMixin<orders, ordersId>;
  hasOrder!: Sequelize.HasManyHasAssociationMixin<orders, ordersId>;
  hasOrders!: Sequelize.HasManyHasAssociationsMixin<orders, ordersId>;
  countOrders!: Sequelize.HasManyCountAssociationsMixin;
  // addresses belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

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
          references: {
            model: "users",
            key: "id",
          },
        },
        is_home: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        full_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        latin_full_name: {
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
        timestamps: true,
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
