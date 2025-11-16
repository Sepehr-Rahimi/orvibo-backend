import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface variablesAttributes {
  id: number;
  name: string;
  value: string;
  description?: string;
}

export type variablesPk = "id" | "name";
export type variablesId = variables[variablesPk];
export type variablesOptionalAttributes = "id" | "description";
export type variablesCreationAttributes = Optional<variablesAttributes, variablesOptionalAttributes>;

export class variables extends Model<variablesAttributes, variablesCreationAttributes> implements variablesAttributes {
  id!: number;
  name!: string;
  value!: string;
  description?: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof variables {
    return variables.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'variables',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "variables_pkey",
        unique: true,
        fields: [
          { name: "id" },
          { name: "name" },
        ]
      },
    ]
  });
  }
}
