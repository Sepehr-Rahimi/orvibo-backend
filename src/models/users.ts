import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface usersAttributes {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  password: string;
  created_at?: Date;
  role: number;
  status?: number;
}

export type usersPk = "id";
export type usersId = users[usersPk];
export type usersOptionalAttributes = "id" | "email" | "role" | "created_at";

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
  first_name!: string;
  last_name!: string;
  email?: string;
  password!: string;
  created_at?: Date;
  role!: number;
  status!: number;

  static initModel(sequelize: Sequelize.Sequelize): typeof users {
    return users.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true, // Auto-increment the id
          primaryKey: true, // Mark as primary key
          allowNull: false, // Ensure it can't be NULL
        },
        phone_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: "",
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false,
        },
        role: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: "users",
        schema: "public",
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
