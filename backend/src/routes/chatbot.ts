import { FastifyInstance } from "fastify";
import { AppDataSource } from "../data-source";
import { EmploymentHistory } from "../entities/EmploymentHistory";
import { parseUserChat, extractFieldValue } from "../services/openaiService";

// Session store for the chatbot context
const activeSessions: Record<number, any> = {};

export default async function chatbotRoutes(server: FastifyInstance) {
    const empRepo = AppDataSource.getRepository(EmploymentHistory);

    server.addHook("onRequest", server.authenticate);

    server.post("/message", async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const { message } = request.body as { message: string };

        // Initialize session if not exists
        if (!activeSessions[userId]) {
            activeSessions[userId] = { step: "IDLE", tempData: {} };
        }
        const session = activeSessions[userId];
        const text = message.trim().toLowerCase();

        // 1. Exit / Reset Flow
        if (["cancel", "restart", "menu", "exit", "close", "start from beginning"].includes(text)) {
            const updates = session.tempData?.updates;
            // If they were updating, save on exit.
            if ((session.step === "AWAIT_UPDATE_FIELD" || session.step === "AWAIT_UPDATE_VALUE") && updates && Object.keys(updates).length > 0) {
                const record = await empRepo.findOne({ where: { id: session.tempData.recordId, user_id: userId } });
                if (record) {
                    if (updates["company name"]) record.company_name = updates["company name"];
                    if (updates["from date"]) record.from_date = new Date(updates["from date"]);
                    if (updates["to date"] !== undefined) record.to_date = updates["to date"] === null ? null as any : new Date(updates["to date"]);
                    if (updates["currently working"] !== undefined) record.is_currently_working = updates["currently working"];
                    if (updates["to date"] === null) record.is_currently_working = true;
                    await empRepo.save(record);
                }
                activeSessions[userId] = { step: "IDLE", tempData: {} };
                return reply.send({
                    messages: ["Changes saved successfully!", "What would you like to do next?"],
                    options: ["Create new employment", "Update existing", "Delete existing"]
                });
            }

            activeSessions[userId] = { step: "IDLE", tempData: {} };
            return reply.send({
                messages: ["Back to main menu. What would you like to do next?"],
                options: ["Create new employment", "Update existing", "Delete existing"]
            });
        }

        try {
            const existingRecords = await empRepo.find({ where: { user_id: userId } });

            // 2. Strict UI State Machine
            if (session.step === "AWAIT_MANAGE_SELECT") {
                const match = message.match(/^(\d+):/);
                let recordId = match ? parseInt(match[1]) : parseInt(text);

                if (isNaN(recordId)) {
                    // Try by exact company name if they typed it
                    const found = existingRecords.find(r => r.company_name.toLowerCase() === text);
                    if (found) recordId = found.id;
                }

                if (!recordId || isNaN(recordId)) {
                    return reply.send({
                        messages: ["Please select a valid option from the buttons."],
                        options: existingRecords.map(r => `${r.id}: ${r.company_name}`)
                    });
                }

                const record = existingRecords.find(r => r.id === recordId);
                if (!record) return reply.send({ messages: ["Record not found."] });

                session.tempData.recordId = recordId;
                session.tempData.companyName = record.company_name;

                if (session.tempData.intendedAction === "DELETE") {
                    await empRepo.softRemove(record);
                    activeSessions[userId] = { step: "IDLE", tempData: {} };
                    return reply.send({ messages: [`Record ${recordId} deleted successfully.`], options: ["Create new employment", "Update existing", "Delete existing"] });
                } else if (session.tempData.intendedAction === "UPDATE") {
                    session.step = "AWAIT_UPDATE_FIELD";
                    session.tempData.updates = {}; // reset updates
                    return reply.send({
                        messages: [`What would you like to update for ${record.company_name}?`],
                        options: ["Company Name", "From Date", "To Date", "Currently Working", "Exit"]
                    });
                } else {
                    session.step = "AWAIT_MANAGE_ACTION";
                    return reply.send({
                        messages: [`You selected ${record.company_name}. What would you like to do?`],
                        options: ["Update", "Delete", "Cancel"]
                    });
                }
            }

            if (session.step === "AWAIT_MANAGE_ACTION") {
                if (text === "delete") {
                    const record = existingRecords.find(r => r.id === session.tempData.recordId);
                    if (record) await empRepo.softRemove(record);
                    activeSessions[userId] = { step: "IDLE", tempData: {} };
                    return reply.send({
                        messages: ["Record deleted successfully."],
                        options: ["Create new employment", "Update existing", "Delete existing"]
                    });
                } else if (text === "update") {
                    session.step = "AWAIT_UPDATE_FIELD";
                    session.tempData.updates = {};
                    return reply.send({
                        messages: [`What would you like to update for ${session.tempData.companyName}?`],
                        options: ["Company Name", "From Date", "To Date", "Currently Working", "Exit"]
                    });
                } else {
                    return reply.send({ messages: ["Please choose Update, Delete, or Cancel."], options: ["Update", "Delete", "Cancel"] });
                }
            }

            if (session.step === "AWAIT_UPDATE_FIELD") {
                const fields = ["company name", "from date", "to date", "currently working"];
                if (!fields.includes(text)) {
                    return reply.send({ messages: ["Please select one of the valid fields."], options: ["Company Name", "From Date", "To Date", "Currently Working", "Exit"] });
                }

                session.tempData.updateField = text;
                session.step = "AWAIT_UPDATE_VALUE";
                let promptMsg = `Please enter the new value for ${text}:`;
                if (text === "from date" || text === "to date") promptMsg += " (YYYY-MM-DD or Present)";
                if (text === "currently working") promptMsg += " (yes/no)";

                return reply.send({ messages: [promptMsg] });
            }

            if (session.step === "AWAIT_UPDATE_VALUE") {
                const field = session.tempData.updateField;
                let parsedValue: any = message;

                const extracted = await extractFieldValue(message, field as any);
                if (extracted !== null) {
                    parsedValue = String(extracted);
                }

                if (field.includes("date")) {
                    if (String(parsedValue).toLowerCase() === "present") {
                        parsedValue = null;
                        session.tempData.updates["currently working"] = true;
                    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(parsedValue).trim())) {
                        return reply.send({ messages: ["Invalid date. Please use YYYY-MM-DD format."] });
                    } else {
                        parsedValue = String(parsedValue).trim();
                    }
                } else if (field === "currently working") {
                    parsedValue = extracted !== null ? extracted : ["yes", "true", "1", "y"].includes(text);
                }

                session.tempData.updates[field] = parsedValue;
                session.step = "AWAIT_UPDATE_FIELD";

                return reply.send({
                    messages: [`Got it. ${field} set to ${parsedValue}. Any other fields you want to update? Click 'Exit' to save.`],
                    options: ["Company Name", "From Date", "To Date", "Currently Working", "Exit"]
                });
            }

            // 3. IDLE Flow -- Handle structured shortcuts directly to bypass OpenAI for speed
            if (text === "create new employment") {
                session.step = "AWAIT_CREATE_COMPANY";
                session.tempData.createData = {};
                return reply.send({ messages: ["Let's add a new employment record. Please enter the Company Name:"] });
            }

            if (session.step === "AWAIT_CREATE_COMPANY") {
                const extracted = await extractFieldValue(message, "company name") as string;
                const companyName = extracted || message.trim();
                session.tempData.createData.company_name = companyName;
                session.step = "AWAIT_CREATE_FROM_DATE";
                return reply.send({ messages: [`Got it. Company set to ${companyName}. Now please enter the start date (YYYY-MM-DD):`] });
            }

            if (session.step === "AWAIT_CREATE_FROM_DATE") {
                const extracted = await extractFieldValue(message, "from date") as string;
                const fromDate = extracted || message.trim();
                if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
                    return reply.send({ messages: ["Invalid date. Please use YYYY-MM-DD format for the start date."] });
                }
                session.tempData.createData.from_date = fromDate;
                session.step = "AWAIT_CREATE_TO_DATE";
                return reply.send({ messages: [`Start date set to ${fromDate}. Now enter the end date (YYYY-MM-DD), or type 'Present' if you are currently working there:`] });
            }

            if (session.step === "AWAIT_CREATE_TO_DATE") {
                let to_date = null;
                let is_currently_working = false;

                const extracted = await extractFieldValue(message, "to date") as string;
                const toDateVal = extracted || message.trim();

                if (toDateVal.toLowerCase() === "present") {
                    is_currently_working = true;
                } else if (!/^\d{4}-\d{2}-\d{2}$/.test(toDateVal)) {
                    return reply.send({ messages: ["Invalid date. Please use YYYY-MM-DD format or type 'Present'."] });
                } else {
                    to_date = toDateVal;
                }

                const newRecord = empRepo.create({
                    user_id: userId,
                    company_name: session.tempData.createData.company_name,
                    from_date: new Date(session.tempData.createData.from_date),
                    to_date: to_date ? new Date(to_date) : null,
                    is_currently_working
                });
                await empRepo.save(newRecord);

                activeSessions[userId] = { step: "IDLE", tempData: {} };
                return reply.send({
                    messages: ["Record saved successfully!", "What would you like to do next?"],
                    options: ["Create new employment", "Update existing", "Delete existing"]
                });
            }

            if (text === "update existing" || text === "delete existing" || text === "manage existing") {
                if (existingRecords.length === 0) {
                    return reply.send({ messages: ["You don't have any existing records."], options: ["Create new employment"] });
                }
                session.step = "AWAIT_MANAGE_SELECT";
                if (text === "update existing") session.tempData.intendedAction = "UPDATE";
                else if (text === "delete existing") session.tempData.intendedAction = "DELETE";
                else session.tempData.intendedAction = null;

                return reply.send({
                    messages: ["Please select a record from the options below:"],
                    options: existingRecords.map(r => `${r.id}: ${r.company_name}`)
                });
            }

            // 4. OpenAI Intent Parsing for custom text
            const parsed = await parseUserChat(message, session, existingRecords);

            if (parsed.intent === "CREATE") {
                if (parsed.company_name) session.tempData.company_name = parsed.company_name;
                if (parsed.from_date) session.tempData.from_date = parsed.from_date;
                if (parsed.to_date) session.tempData.to_date = parsed.to_date;
                if (parsed.is_currently_working !== undefined && parsed.is_currently_working !== null) {
                    session.tempData.is_currently_working = parsed.is_currently_working;
                }

                if (session.tempData.company_name && session.tempData.from_date && (session.tempData.to_date || session.tempData.is_currently_working)) {
                    const newRecord = empRepo.create({
                        user_id: userId,
                        company_name: session.tempData.company_name,
                        from_date: new Date(session.tempData.from_date),
                        to_date: session.tempData.to_date ? new Date(session.tempData.to_date) : null,
                        is_currently_working: session.tempData.is_currently_working || false
                    });
                    await empRepo.save(newRecord);

                    activeSessions[userId] = { step: "IDLE", tempData: {} };
                    return reply.send({
                        messages: ["Record saved successfully!", "Is there anything else I can help you with?"],
                        options: ["Create new employment", "Update existing", "Delete existing"]
                    });
                } else {
                    return reply.send({ messages: [parsed.response_message] });
                }
            }
            else if (parsed.intent === "UPDATE" || parsed.intent === "DELETE") {
                if (!parsed.record_id) {
                    session.step = "AWAIT_MANAGE_SELECT";
                    session.tempData.intendedAction = parsed.intent;
                    return reply.send({
                        messages: [parsed.response_message || "Which record would you like to manage?"],
                        options: existingRecords.map(r => `${r.id}: ${r.company_name}`)
                    });
                }

                const record = existingRecords.find(r => r.id === parsed.record_id);
                if (!record) {
                    return reply.send({ messages: [`Record ${parsed.record_id} not found.`] });
                }

                if (parsed.intent === "DELETE") {
                    await empRepo.softRemove(record);
                    activeSessions[userId] = { step: "IDLE", tempData: {} };
                    return reply.send({ messages: [`Record deleted successfully.`], options: ["Create new employment", "Update existing", "Delete existing"] });
                } else {
                    session.step = "AWAIT_UPDATE_FIELD";
                    session.tempData.recordId = record.id;
                    session.tempData.companyName = record.company_name;
                    session.tempData.updates = {};

                    let updateFound = false;
                    if (parsed.company_name) { session.tempData.updates["company name"] = parsed.company_name; updateFound = true; }
                    if (parsed.from_date) { session.tempData.updates["from date"] = parsed.from_date; updateFound = true; }
                    if (parsed.to_date) { session.tempData.updates["to date"] = parsed.to_date; updateFound = true; }
                    if (parsed.is_currently_working !== undefined && parsed.is_currently_working !== null) { session.tempData.updates["currently working"] = parsed.is_currently_working; updateFound = true; }

                    if (updateFound) {
                        return reply.send({ messages: [`Got it. Any other fields you want to update? Click 'Exit' to save.`], options: ["Company Name", "From Date", "To Date", "Currently Working", "Exit"] });
                    } else {
                        return reply.send({ messages: [`What would you like to update for ${record.company_name}?`], options: ["Company Name", "From Date", "To Date", "Currently Working", "Exit"] });
                    }
                }
            }
            else {
                return reply.send({ messages: [parsed.response_message || "I didn't quite get that."] });
            }

        } catch (e) {
            console.error(e);
            return reply.send({ messages: ["Something went wrong processing your request with OpenAI. Please ensure the API key is valid, or type 'cancel' to reset."] });
        }
    });

    server.get("/init", async (request, reply) => {
        const { userId } = request.user as { userId: number };
        const count = await empRepo.count({ where: { user_id: userId } });
        activeSessions[userId] = { step: "IDLE", tempData: {} }; // Auto reset on /init

        if (count === 0) {
            return reply.send({
                messages: ["Hello! I'm your AI HR Assistant. It looks like you don't have any employment history yet. Do you want to add one? (e.g., 'I worked at Google from 2020-01-01 to 2022-01-01')"],
                options: ["Create new employment"]
            });
        } else {
            return reply.send({
                messages: ["Welcome back! I'm your AI HR Assistant. What would you like to do? You can say things like 'Add a new job', 'Delete record #3', or 'Update my Google record'."],
                options: ["Create new employment", "Update existing", "Delete existing"]
            });
        }
    });
}
