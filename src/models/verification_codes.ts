import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface verification_codesAttributes {
  id: number;
  phone_or_email: string;
  code: string;
  expires_at: Date;
  is_used?: boolean;
}

export type verification_codesPk = "id";
export type verification_codesId = verification_codes[verification_codesPk];
export type verification_codesOptionalAttributes = "id" | "is_used";
export type verification_codesCreationAttributes = Optional<verification_codesAttributes, verification_codesOptionalAttributes>;

export class verification_codes extends Model<verification_codesAttributes, verification_codesCreationAttributes> implements verification_codesAttributes {
  id!: number;
  phone_or_email!: string;
  code!: string;
  expires_at!: Date;
  is_used?: boolean;


  static initModel(sequelize: Sequelize.Sequelize): typeof verification_codes {
    return verification_codes.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    phone_or_email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'verification_codes',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "verification_codes_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
