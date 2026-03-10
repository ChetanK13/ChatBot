import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "chatbot_hrms",
    synchronize: true, // Auto-create tables (dev only)
    logging: false,
    entities: [__dirname + "/entities/*.{js,ts}"],
    migrations: [],
    subscribers: [],
});
