import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { order_items, order_itemsId } from "./order_items";
import type { products, productsId } from "./products";

export interface products_variantsAttributes {
  id: number;
  product_id: number;
  color: string;
  kind?: string;
  stock: number;
  currency_price?: number;
  price: number;
  discount_price?: number;
  is_published?: boolean;
}

export type products_variantsPk = "id";
export type products_variantsId = products_variants[products_variantsPk];
export type products_variantsOptionalAttributes =
  | "id"
  | "kind"
  | "stock"
  | "currency_price"
  | "price"
  | "discount_price"
  | "is_published";
export type products_variantsCreationAttributes = Optional<
  products_variantsAttributes,
  products_variantsOptionalAttributes
>;

export class products_variants
  extends Model<
    products_variantsAttributes,
    products_variantsCreationAttributes
  >
  implements products_variantsAttributes
{
  id!: number;
  product_id!: number;
  color!: string;
  kind?: string;
  stock!: number;
  currency_price?: number;
  price!: number;
  discount_price?: number;
  is_published?: boolean;

  // products_variants belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;
  // products_variants hasMany order_items via variant_id
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

  static initModel(sequelize: Sequelize.Sequelize): typeof products_variants {
    return products_variants.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "products",
            key: "id",
          },
        },
        color: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        kind: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        stock: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        currency_price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        discount_price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        is_published: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: "products_variants",
        schema: "public",
        timestamps: false,
        indexes: [
          {
            name: "products_variants_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
