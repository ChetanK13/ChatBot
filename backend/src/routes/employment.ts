import { FastifyInstance } from "fastify";
import { AppDataSource } from "../data-source";
import { EmploymentHistory } from "../entities/EmploymentHistory";

export default async function employmentRoutes(server: FastifyInstance) {
    const empRepo = AppDataSource.getRepository(EmploymentHistory);

    // Apply authentication middleware to all employment routes
    server.addHook("onRequest", server.authenticate);

    server.get("/", async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const histories = await empRepo.find({
            where: { user_id: userId },
            order: { from_date: "DESC" },
        });
        return reply.send(histories);
    });

    server.post("/", async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const { company_name, from_date, to_date, is_currently_working } = request.body as any;

        if (!company_name || !from_date) {
            return reply.status(400).send({ error: "Company name and from date are required." });
        }

        const newHistory = empRepo.create({
            user_id: userId,
            company_name,
            from_date: new Date(from_date),
            to_date: to_date ? new Date(to_date) : undefined,
            is_currently_working: is_currently_working || false,
        });

        await empRepo.save(newHistory);
        return reply.status(201).send(newHistory);
    });

    server.put("/:id", async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const { id } = request.params as { id: string };
        const updateData = request.body as Partial<EmploymentHistory>;

        const history = await empRepo.findOne({ where: { id: parseInt(id), user_id: userId } });

        if (!history) {
            return reply.status(404).send({ error: "Employment history not found." });
        }

        // Assign mapped values safely
        if (updateData.company_name) history.company_name = updateData.company_name;
        if (updateData.from_date) history.from_date = new Date(updateData.from_date);
        if (updateData.to_date) history.to_date = new Date(updateData.to_date);
        if (updateData.is_currently_working !== undefined) history.is_currently_working = updateData.is_currently_working;

        await empRepo.save(history);
        return reply.send(history);
    });

    server.delete("/:id", async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const { id } = request.params as { id: string };

        const history = await empRepo.findOne({ where: { id: parseInt(id), user_id: userId } });
        if (!history) {
            return reply.status(404).send({ error: "Employment history not found." });
        }

        await empRepo.softRemove(history);
        return reply.send({ message: "Employment history removed." });
    });
}
