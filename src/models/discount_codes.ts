import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface discount_codesAttributes {
  id: number;
  code: string;
  type: string;
  value: number;
  min_order?: number;
  max_amount?: number;
  max_uses?: number;
  used_count?: number;
  start_date: Date;
  end_date: Date;
  active?: boolean;
  user_specific?: boolean;
  permitted_users?: number[];
  created_at?: Date;
}

export type discount_codesPk = "id";
export type discount_codesId = discount_codes[discount_codesPk];
export type discount_codesOptionalAttributes =
  | "id"
  | "min_order"
  | "max_uses"
  | "used_count"
  | "active"
  | "user_specific"
  | "created_at";
export type discount_codesCreationAttributes = Optional<
  discount_codesAttributes,
  discount_codesOptionalAttributes
>;

export class discount_codes
  extends Model<discount_codesAttributes, discount_codesCreationAttributes>
  implements discount_codesAttributes
{
  id!: number;
  code!: string;
  type!: string;
  value!: number;
  min_order?: number;
  max_amount?: number;
  max_uses?: number;
  used_count?: number;
  start_date!: Date;
  end_date!: Date;
  active?: boolean;
  user_specific?: boolean;
  permitted_users?: number[];
  created_at?: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof discount_codes {
    return discount_codes.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        value: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        min_order: {
          type: DataTypes.DECIMAL,
          allowNull: true,
          defaultValue: 0,
        },
        max_amount: {
          type: DataTypes.DECIMAL,
          allowNull: true,
          defaultValue: 0,
        },
        max_uses: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        used_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        permitted_users: {
          type: DataTypes.ARRAY(DataTypes.INTEGER),
          allowNull: true,
        },
        user_specific: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: "discount_codes",
        schema: "public",
        timestamps: true,
        indexes: [
          {
            name: "discount_codes_code_key",
            unique: true,
            fields: [{ name: "code" }],
          },
          {
            name: "discount_codes_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
