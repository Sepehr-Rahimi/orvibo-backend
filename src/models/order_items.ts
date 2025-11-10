import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface order_itemsAttributes {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  color?: string;
  size?: string;
  type?: string;
  price: number;
}

export type order_itemsPk = "id";
export type order_itemsId = order_items[order_itemsPk];
export type order_itemsOptionalAttributes = "id" | "color" | "size" | "type";
export type order_itemsCreationAttributes = Optional<
  order_itemsAttributes,
  order_itemsOptionalAttributes
>;

export class order_items
  extends Model<order_itemsAttributes, order_itemsCreationAttributes>
  implements order_itemsAttributes
{
  id!: number;
  order_id!: number;
  product_id!: number;
  quantity!: number;
  color?: string;
  size?: string;
  type?: string;
  price!: number;

  static associate(models: any) {
    this.belongsTo(models.orders, {
      foreignKey: "order_id",
      as: "order",
    });
    this.belongsTo(models.products, {
      foreignKey: "product_id",
    });
  }

  static initModel(sequelize: Sequelize.Sequelize): typeof order_items {
    return order_items.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        color: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        size: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "order_items",
        schema: "public",

        indexes: [
          {
            name: "order_items_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
