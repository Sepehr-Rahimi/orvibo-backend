import { DataTypes, Sequelize } from "sequelize";
import dotenv from "dotenv";
import pgvector from "pgvector/sequelize";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || "",
  process.env.DB_USER || "",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST,
    dialect: "postgres",

    define: {
      timestamps: true, // Enable timestamps globally
      createdAt: "created_at", // Custom name for createdAt
      updatedAt: false, // Custom name for updatedAt
    },
    logging: console.log, // Enable logging
  }
);

export default sequelize;
