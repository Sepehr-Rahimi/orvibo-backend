import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { addresses, addressesId } from "./addresses";
import type { order_items, order_itemsId } from "./order_items";
import type { users, usersId } from "./users";

export interface ordersAttributes {
  id?: number;
  user_id: number;
  address_id: number;
  total_cost: number;
  discount_code?: string;
  discount_amount?: number;
  delivery_cost: number;
  type_of_delivery: string;
  status: string;
  created_at?: Date;
  type_of_payment: string;
  payment_authority?: string;
  payment_status: number;
  service_cost?: number;
  guarantee_cost?: number;
  shipping_cost?: number;
  business_profit?: number;
}

export type ordersPk = "id";
export type ordersId = orders[ordersPk];
export type ordersOptionalAttributes =
  | "discount_code"
  | "discount_amount"
  | "created_at"
  | "payment_authority"
  | "payment_status"
  | "service_cost"
  | "guarantee_cost"
  | "shipping_cost"
  | "business_profit"
  | "id";
export type ordersCreationAttributes = Optional<
  ordersAttributes,
  ordersOptionalAttributes
>;

export class orders
  extends Model<ordersAttributes, ordersCreationAttributes>
  implements ordersAttributes
{
  id!: number;
  user_id!: number;
  address_id!: number;
  total_cost!: number;
  discount_code?: string;
  discount_amount?: number;
  delivery_cost!: number;
  type_of_delivery!: string;
  status!: string;
  created_at?: Date;
  type_of_payment!: string;
  payment_authority?: string;
  payment_status!: number;
  service_cost?: number;
  guarantee_cost?: number;
  shipping_cost?: number;
  business_profit?: number;

  // orders belongsTo addresses via address_id
  address!: addresses;
  getAddress!: Sequelize.BelongsToGetAssociationMixin<addresses>;
  setAddress!: Sequelize.BelongsToSetAssociationMixin<addresses, addressesId>;
  createAddress!: Sequelize.BelongsToCreateAssociationMixin<addresses>;
  // orders hasMany order_items via order_id
  order_items!: order_items[];
  getOrder_items!: Sequelize.HasManyGetAssociationsMixin<order_items>;
  setOrder_items!: Sequelize.HasManySetAssociationsMixin<
    order_items,
    order_itemsId
  >;
  addOrder_item!: Sequelize.HasManyAddAssociationMixin<
    order_items,
    order_itemsId
  >;
  addOrder_items!: Sequelize.HasManyAddAssociationsMixin<
    order_items,
    order_itemsId
  >;
  createOrder_item!: Sequelize.HasManyCreateAssociationMixin<order_items>;
  removeOrder_item!: Sequelize.HasManyRemoveAssociationMixin<
    order_items,
    order_itemsId
  >;
  removeOrder_items!: Sequelize.HasManyRemoveAssociationsMixin<
    order_items,
    order_itemsId
  >;
  hasOrder_item!: Sequelize.HasManyHasAssociationMixin<
    order_items,
    order_itemsId
  >;
  hasOrder_items!: Sequelize.HasManyHasAssociationsMixin<
    order_items,
    order_itemsId
  >;
  countOrder_items!: Sequelize.HasManyCountAssociationsMixin;
  // orders belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof orders {
    return orders.init(
      {
        id: {
          autoIncrement: true,
          autoIncrementIdentity: true,
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
        address_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "addresses",
            key: "id",
          },
        },
        total_cost: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        service_cost: {
          type: DataTypes.NUMBER,
          allowNull: true,
        },
        guarantee_cost: {
          type: DataTypes.NUMBER,
          allowNull: true,
        },
        business_profit: {
          type: DataTypes.NUMBER,
          allowNull: true,
        },
        shipping_cost: {
          type: DataTypes.NUMBER,
          allowNull: true,
        },
        discount_code: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        discount_amount: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        delivery_cost: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        type_of_delivery: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: "1 order submitted | 2 order delivered | 3 order canceled ",
        },
        type_of_payment: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: "1 credit card payment | 2 cash on delivery",
        },
        payment_authority: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        payment_status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: "0 not paid | 1 paid",
        },
      },
      {
        sequelize,
        tableName: "orders",
        schema: "public",
        timestamps: true,
        indexes: [
          {
            name: "orders_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
