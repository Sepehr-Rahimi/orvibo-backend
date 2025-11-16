import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface blogsAttributes {
  id: number;
  title: string;
  summary: string;
  content: string;
  cover?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  is_published?: boolean;
  created_at?: Date;
}

export type blogsPk = "id";
export type blogsId = blogs[blogsPk];
export type blogsOptionalAttributes = "id" | "cover" | "tags" | "meta_title" | "meta_description" | "meta_keywords" | "is_published" | "created_at";
export type blogsCreationAttributes = Optional<blogsAttributes, blogsOptionalAttributes>;

export class blogs extends Model<blogsAttributes, blogsCreationAttributes> implements blogsAttributes {
  id!: number;
  title!: string;
  summary!: string;
  content!: string;
  cover?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  is_published?: boolean;
  created_at?: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof blogs {
    return blogs.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cover: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    meta_keywords: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'blogs',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "blogs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
