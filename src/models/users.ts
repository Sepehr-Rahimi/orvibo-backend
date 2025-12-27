import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { addresses, addressesId } from "./addresses";
import type { orders, ordersId } from "./orders";

export interface usersAttributes {
  id?: number;
  phone_number: string;
  first_name?: string;
  email?: string;
  password: string;
  created_at: Date;
  last_name?: string;
  role: number;
  status: number;
}

export type usersPk = "id";
export type usersId = users[usersPk];
export type usersOptionalAttributes =
  | "id"
  | "first_name"
  | "email"
  | "created_at"
  | "last_name"
  | "role"
  | "status";
export type usersCreationAttributes = Optional<
  usersAttributes,
  usersOptionalAttributes
>;

export class users
  extends Model<usersAttributes, usersCreationAttributes>
  implements usersAttributes
{
  id!: number;
  phone_number!: string;
  first_name?: string;
  email?: string;
  password!: string;
  created_at!: Date;
  last_name?: string;
  role!: number;
  status!: number;

  // users hasMany addresses via user_id
  addresses!: addresses[];
  getAddresses!: Sequelize.HasManyGetAssociationsMixin<addresses>;
  setAddresses!: Sequelize.HasManySetAssociationsMixin<addresses, addressesId>;
  addAddress!: Sequelize.HasManyAddAssociationMixin<addresses, addressesId>;
  addAddresses!: Sequelize.HasManyAddAssociationsMixin<addresses, addressesId>;
  createAddress!: Sequelize.HasManyCreateAssociationMixin<addresses>;
  removeAddress!: Sequelize.HasManyRemoveAssociationMixin<
    addresses,
    addressesId
  >;
  removeAddresses!: Sequelize.HasManyRemoveAssociationsMixin<
    addresses,
    addressesId
  >;
  hasAddress!: Sequelize.HasManyHasAssociationMixin<addresses, addressesId>;
  hasAddresses!: Sequelize.HasManyHasAssociationsMixin<addresses, addressesId>;
  countAddresses!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany orders via user_id
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

  static initModel(sequelize: Sequelize.Sequelize): typeof users {
    return users.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        phone_number: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: "users_phone_number_key",
        },
        first_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        role: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: "1=customer;2=admin",
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: "0 not verifyed , 1 verifyed",
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "users",
        schema: "public",
        timestamps: true,
        indexes: [
          {
            name: "users_phone_number_key",
            unique: true,
            fields: [{ name: "phone_number" }],
          },
          {
            name: "users_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
