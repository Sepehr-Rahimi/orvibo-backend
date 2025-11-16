import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { products, productsId } from './products';

export interface brandsAttributes {
  id: number;
  name: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  english_name?: string;
  is_active?: boolean;
  created_at?: Date;
}

export type brandsPk = "id";
export type brandsId = brands[brandsPk];
export type brandsOptionalAttributes = "id" | "logo_url" | "website_url" | "description" | "english_name" | "is_active" | "created_at";
export type brandsCreationAttributes = Optional<brandsAttributes, brandsOptionalAttributes>;

export class brands extends Model<brandsAttributes, brandsCreationAttributes> implements brandsAttributes {
  id!: number;
  name!: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  english_name?: string;
  is_active?: boolean;
  created_at?: Date;

  // brands hasMany products via brand_id
  products!: products[];
  getProducts!: Sequelize.HasManyGetAssociationsMixin<products>;
  setProducts!: Sequelize.HasManySetAssociationsMixin<products, productsId>;
  addProduct!: Sequelize.HasManyAddAssociationMixin<products, productsId>;
  addProducts!: Sequelize.HasManyAddAssociationsMixin<products, productsId>;
  createProduct!: Sequelize.HasManyCreateAssociationMixin<products>;
  removeProduct!: Sequelize.HasManyRemoveAssociationMixin<products, productsId>;
  removeProducts!: Sequelize.HasManyRemoveAssociationsMixin<products, productsId>;
  hasProduct!: Sequelize.HasManyHasAssociationMixin<products, productsId>;
  hasProducts!: Sequelize.HasManyHasAssociationsMixin<products, productsId>;
  countProducts!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof brands {
    return brands.init({
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
    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    english_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'brands',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "brands_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
