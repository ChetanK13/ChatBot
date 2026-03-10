import fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";

dotenv.config();

const server = fastify({ logger: true });

server.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
});

server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "super-secret",
});

import { authPlugin } from "./plugins/authPlugin";
import authRoutes from "./routes/auth";
import employmentRoutes from "./routes/employment";
import chatbotRoutes from "./routes/chatbot";

// Register Plugins
server.register(authPlugin);

// Welcome Route
server.get("/", async (request, reply) => {
    return { status: "OK", message: "HRMS API Running" };
});

// Register Routes
server.register(authRoutes, { prefix: "/auth" });
server.register(employmentRoutes, { prefix: "/employment" });
server.register(chatbotRoutes, { prefix: "/chatbot" });

const start = async () => {
    try {
        // Initialize Database
        await AppDataSource.initialize();
        server.log.info("Database connection established.");

        // Start Server
        const port = parseInt(process.env.PORT || "3000");
        await server.listen({ port, host: "0.0.0.0" });
        server.log.info(`Server listening on port ${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
