import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

export default async function authRoutes(server: FastifyInstance) {
    const userRepository = AppDataSource.getRepository(User);

    server.post("/signup", async (request, reply) => {
        const { first_name, last_name, email, password, confirm_password } = request.body as any;

        if (!first_name || !last_name || !email || !password || !confirm_password) {
            return reply.status(400).send({ error: "All fields are required" });
        }

        if (password !== confirm_password) {
            return reply.status(400).send({ error: "Passwords do not match" });
        }

        const existingUser = await userRepository.findOneBy({ email });
        if (existingUser) {
            return reply.status(400).send({ error: "Email is already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = userRepository.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
        });

        await userRepository.save(newUser);

        return reply.status(201).send({ message: "User created successfully" });
    });

    server.post("/login", async (request, reply) => {
        const { email, password } = request.body as any;

        if (!email || !password) {
            return reply.status(400).send({ error: "Email and password are required" });
        }

        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return reply.status(401).send({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return reply.status(401).send({ error: "Invalid credentials" });
        }

        const token = server.jwt.sign({
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
        });

        return reply.send({ token });
    });

    server.get("/me", { preValidation: [server.authenticate] }, async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const user = await userRepository.findOneBy({ id: userId });
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }
        return reply.send({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        });
    });

    server.put("/me", { preValidation: [server.authenticate] }, async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const { first_name, last_name, email } = request.body as any;

        const user = await userRepository.findOneBy({ id: userId });
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }

        if (first_name) user.first_name = first_name;
        if (last_name) user.last_name = last_name;
        if (email) user.email = email;

        await userRepository.save(user);

        return reply.send({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        });
    });
}
