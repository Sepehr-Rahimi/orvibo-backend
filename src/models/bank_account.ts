import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface bank_accountsAttributes {
  id: number;
  name: string;
  card_number: string;
  sheba_number: string;
}

export type bank_accountsPk = "id";
export type bankAccountsId = bank_accounts[bank_accountsPk];
export type bank_accountsOptionalAttributes = "id";
export type bank_accountsCreationAttributes = Optional<
  bank_accountsAttributes,
  bank_accountsOptionalAttributes
>;

export class bank_accounts
  extends Model<bank_accountsAttributes, bank_accountsCreationAttributes>
  implements bank_accountsAttributes
{
  id!: number;
  name!: string;
  card_number!: string;
  sheba_number!: string;

  static initModel(sequelize: Sequelize.Sequelize): typeof bank_accounts {
    return bank_accounts.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        card_number: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        sheba_number: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "bank_accounts",
        schema: "public",
        timestamps: false,
        indexes: [
          {
            name: "bank_accounts_pkey",
            unique: true,
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }
}
