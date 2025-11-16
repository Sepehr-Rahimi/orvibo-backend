import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface bank_accountsAttributes {
  id: number;
  name?: string;
  card_number?: string;
  sheba_number?: string;
}

export type bank_accountsPk = "id";
export type bank_accountsId = bank_accounts[bank_accountsPk];
export type bank_accountsOptionalAttributes = "name" | "card_number" | "sheba_number";
export type bank_accountsCreationAttributes = Optional<bank_accountsAttributes, bank_accountsOptionalAttributes>;

export class bank_accounts extends Model<bank_accountsAttributes, bank_accountsCreationAttributes> implements bank_accountsAttributes {
  id!: number;
  name?: string;
  card_number?: string;
  sheba_number?: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof bank_accounts {
    return bank_accounts.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    card_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sheba_number: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'bank_accounts',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "bank_accounts_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
