import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { orders, ordersId } from './orders';
import type { products, productsId } from './products';
import type { products_variants, products_variantsId } from './products_variants';

export interface order_itemsAttributes {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at?: Date;
  discount_price?: number;
  variant_id: number;
}

export type order_itemsPk = "id";
export type order_itemsId = order_items[order_itemsPk];
export type order_itemsOptionalAttributes = "id" | "created_at" | "discount_price" | "variant_id";
export type order_itemsCreationAttributes = Optional<order_itemsAttributes, order_itemsOptionalAttributes>;

export class order_items extends Model<order_itemsAttributes, order_itemsCreationAttributes> implements order_itemsAttributes {
  id!: number;
  order_id!: number;
  product_id!: number;
  quantity!: number;
  price!: number;
  created_at?: Date;
  discount_price?: number;
  variant_id!: number;

  // order_items belongsTo orders via order_id
  order!: orders;
  getOrder!: Sequelize.BelongsToGetAssociationMixin<orders>;
  setOrder!: Sequelize.BelongsToSetAssociationMixin<orders, ordersId>;
  createOrder!: Sequelize.BelongsToCreateAssociationMixin<orders>;
  // order_items belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;
  // order_items belongsTo products_variants via variant_id
  variant!: products_variants;
  getVariant!: Sequelize.BelongsToGetAssociationMixin<products_variants>;
  setVariant!: Sequelize.BelongsToSetAssociationMixin<products_variants, products_variantsId>;
  createVariant!: Sequelize.BelongsToCreateAssociationMixin<products_variants>;

  static initModel(sequelize: Sequelize.Sequelize): typeof order_items {
    return order_items.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    discount_price: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    variant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      references: {
        model: 'products_variants',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'order_items',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "order_items_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
