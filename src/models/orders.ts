import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface ordersAttributes {
  id: number;
  user_id: number;
  address_id: number;
  total_cost: number;
  discount_code?: string;
  discount_amount?: number;
  delivery_cost: number;
  type_of_delivery: string;
  type_of_payment: string;
  status: string;
  payment_authority?: string;
  payment_status?: number;
  created_at: Date;
}

export type ordersPk = "id";
export type ordersId = orders[ordersPk];
export type ordersOptionalAttributes =
  | "id"
  | "discount_code"
  | "discount_amount"
  | "created_at";
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
  other_costs!: number;
  type_of_delivery!: string;
  type_of_payment!: string;
  status!: string;
  payment_authority!: string;
  payment_status?: number;
  created_at!: Date;

  static associate(models: any) {
    this.belongsTo(models.addresses, {
      foreignKey: "address_id",
      // as: "address",
    });
    this.belongsTo(models.users, {
      foreignKey: "user_id",
      // as: "user",
    });
    this.hasMany(models.order_items, {
      foreignKey: "order_id",
      // as: "order_items",
    });
  }

  static initModel(sequelize: Sequelize.Sequelize): typeof orders {
    return orders.init(
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
        address_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        total_cost: {
          type: DataTypes.DECIMAL,
          allowNull: false,
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
        type_of_payment: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        payment_authority: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        payment_status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "orders",
        schema: "public",
        timestamps: true,
        createdAt: "created_at",
        indexes: [
          {
            name: "orders_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
        // validate: {
        //   userOrGuest() {
        //     if (!this.user_id && !(this.guest_name && this.guest_phone)) {
        //       throw new Error(
        //         "Either user_id must be set OR guest_name and guest_phone must be provided"
        //       );
        //     }
        //   },
        // },
      }
    );
  }
}
