import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { brands, brandsId } from './brands';
import type { categories, categoriesId } from './categories';
import type { order_items, order_itemsId } from './order_items';
import type { products_embedding, products_embeddingId } from './products_embedding';
import type { products_variants, products_variantsId } from './products_variants';

export interface productsAttributes {
  id: number;
  name: string;
  summary?: string;
  images?: string[];
  description?: string;
  model?: string;
  category_id?: number;
  brand_id?: number;
  code?: string;
  label?: string;
  is_published?: boolean;
  created_at?: Date;
  slug: string;
}

export type productsPk = "id";
export type productsId = products[productsPk];
export type productsOptionalAttributes = "id" | "summary" | "images" | "description" | "model" | "category_id" | "brand_id" | "code" | "label" | "is_published" | "created_at";
export type productsCreationAttributes = Optional<productsAttributes, productsOptionalAttributes>;

export class products extends Model<productsAttributes, productsCreationAttributes> implements productsAttributes {
  id!: number;
  name!: string;
  summary?: string;
  images?: string[];
  description?: string;
  model?: string;
  category_id?: number;
  brand_id?: number;
  code?: string;
  label?: string;
  is_published?: boolean;
  created_at?: Date;
  slug!: string;

  // products belongsTo brands via brand_id
  brand!: brands;
  getBrand!: Sequelize.BelongsToGetAssociationMixin<brands>;
  setBrand!: Sequelize.BelongsToSetAssociationMixin<brands, brandsId>;
  createBrand!: Sequelize.BelongsToCreateAssociationMixin<brands>;
  // products belongsTo categories via category_id
  category!: categories;
  getCategory!: Sequelize.BelongsToGetAssociationMixin<categories>;
  setCategory!: Sequelize.BelongsToSetAssociationMixin<categories, categoriesId>;
  createCategory!: Sequelize.BelongsToCreateAssociationMixin<categories>;
  // products hasMany order_items via product_id
  order_items!: order_items[];
  getOrder_items!: Sequelize.HasManyGetAssociationsMixin<order_items>;
  setOrder_items!: Sequelize.HasManySetAssociationsMixin<order_items, order_itemsId>;
  addOrder_item!: Sequelize.HasManyAddAssociationMixin<order_items, order_itemsId>;
  addOrder_items!: Sequelize.HasManyAddAssociationsMixin<order_items, order_itemsId>;
  createOrder_item!: Sequelize.HasManyCreateAssociationMixin<order_items>;
  removeOrder_item!: Sequelize.HasManyRemoveAssociationMixin<order_items, order_itemsId>;
  removeOrder_items!: Sequelize.HasManyRemoveAssociationsMixin<order_items, order_itemsId>;
  hasOrder_item!: Sequelize.HasManyHasAssociationMixin<order_items, order_itemsId>;
  hasOrder_items!: Sequelize.HasManyHasAssociationsMixin<order_items, order_itemsId>;
  countOrder_items!: Sequelize.HasManyCountAssociationsMixin;
  // products hasMany products_embedding via product_id
  products_embeddings!: products_embedding[];
  getProducts_embeddings!: Sequelize.HasManyGetAssociationsMixin<products_embedding>;
  setProducts_embeddings!: Sequelize.HasManySetAssociationsMixin<products_embedding, products_embeddingId>;
  addProducts_embedding!: Sequelize.HasManyAddAssociationMixin<products_embedding, products_embeddingId>;
  addProducts_embeddings!: Sequelize.HasManyAddAssociationsMixin<products_embedding, products_embeddingId>;
  createProducts_embedding!: Sequelize.HasManyCreateAssociationMixin<products_embedding>;
  removeProducts_embedding!: Sequelize.HasManyRemoveAssociationMixin<products_embedding, products_embeddingId>;
  removeProducts_embeddings!: Sequelize.HasManyRemoveAssociationsMixin<products_embedding, products_embeddingId>;
  hasProducts_embedding!: Sequelize.HasManyHasAssociationMixin<products_embedding, products_embeddingId>;
  hasProducts_embeddings!: Sequelize.HasManyHasAssociationsMixin<products_embedding, products_embeddingId>;
  countProducts_embeddings!: Sequelize.HasManyCountAssociationsMixin;
  // products hasMany products_variants via product_id
  products_variants!: products_variants[];
  getProducts_variants!: Sequelize.HasManyGetAssociationsMixin<products_variants>;
  setProducts_variants!: Sequelize.HasManySetAssociationsMixin<products_variants, products_variantsId>;
  addProducts_variant!: Sequelize.HasManyAddAssociationMixin<products_variants, products_variantsId>;
  addProducts_variants!: Sequelize.HasManyAddAssociationsMixin<products_variants, products_variantsId>;
  createProducts_variant!: Sequelize.HasManyCreateAssociationMixin<products_variants>;
  removeProducts_variant!: Sequelize.HasManyRemoveAssociationMixin<products_variants, products_variantsId>;
  removeProducts_variants!: Sequelize.HasManyRemoveAssociationsMixin<products_variants, products_variantsId>;
  hasProducts_variant!: Sequelize.HasManyHasAssociationMixin<products_variants, products_variantsId>;
  hasProducts_variants!: Sequelize.HasManyHasAssociationsMixin<products_variants, products_variantsId>;
  countProducts_variants!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof products {
    return products.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    model: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'brands',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'products',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "products_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "unique_slug_idx",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
    ]
  });
  }
}
