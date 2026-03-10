import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type ChatIntent = "CREATE" | "UPDATE" | "DELETE" | "UNKNOWN";

export interface ParsedChat {
    intent: ChatIntent;
    company_name?: string;
    from_date?: string; // YYYY-MM-DD
    to_date?: string;   // YYYY-MM-DD
    is_currently_working?: boolean;
    record_id?: number; // In case they mention "Update record 3"
    missing_fields?: string[]; // Which fields are still needed based on intent
    response_message: string; // The message the bot should reply with
}

export async function parseUserChat(userMessage: string, state: any, existingRecords: any[] = []): Promise<ParsedChat> {
    const systemPrompt = `
You are a helpful HR assistant managing a user's employment history.
The user might ask to create, update, or delete employment records.

Current conversation state: ${JSON.stringify(state)}
Existing user records: ${JSON.stringify(existingRecords.map(r => ({ id: r.id, company_name: r.company_name })))}

Your goal is to extract the user's intent and any entities (company name, dates) they provide.
Determine the intent strictly as CREATE, UPDATE, DELETE, or UNKNOWN.

Rules for extracting dates:
- Format dates exactly as YYYY-MM-DD.
- If the user says "present", "currently", or similar for the end date, set \`is_currently_working\` to true and \`to_date\` to null.

Rules for conversational flow:
- Generate a \`response_message\` which is what you (the bot) would say next to the user.
- If it's a CREATE intent, make sure they provide company_name, from_date, and (to_date OR is_currently_working). If any are missing, your \`response_message\` should politely ask for the missing details. List the missing details in \`missing_fields\`.
- If it's an UPDATE or DELETE intent, they need to specify which record to update/delete (by ID). If the record ID is missing, you MUST include the list of existing user records (with their IDs and company names) in your \`response_message\` so the user knows their options.
- If it's an UPDATE intent and they specified an ID, they also need to specify what fields to change.

Provide your response as a JSON object matching this schema:
{
  "intent": "CREATE" | "UPDATE" | "DELETE" | "UNKNOWN",
  "company_name": string | null,
  "from_date": "YYYY-MM-DD" | null,
  "to_date": "YYYY-MM-DD" | null,
  "is_currently_working": boolean | null,
  "record_id": number | null,
  "missing_fields": string[],
  "response_message": "String: What the bot should say back"
}
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using gpt-4o-mini for cost-efficiency and speed
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" },
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new Error("No response from OpenAI");

        return JSON.parse(result) as ParsedChat;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return {
            intent: "UNKNOWN",
            response_message: "Sorry, I had trouble understanding that due to a service error. Please try again.",
        };
    }
}

export async function extractFieldValue(userMessage: string, expectedField: "company name" | "from date" | "to date" | "currently working"): Promise<string | boolean | null> {
    const systemPrompt = `
You are a helpful HR data extractor. The user is replying to a prompt asking for their \`${expectedField}\`.
Extract ONLY the core value of the \`${expectedField}\` from the user's message.
- If it's a company name, extract just the name (e.g. "I work at Microsoft" -> "Microsoft").
- If it's a date, format it exactly as "YYYY-MM-DD". If they say "Jan 2022", make it "2022-01-01". If they say "Present" or "Currently", return "Present".
- If it's "currently working", return boolean true or false based on their answer.

Respond with a JSON object: { "extracted_value": "string or boolean or null" }
If you cannot determine the value, return null.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" },
        });

        const result = completion.choices[0].message.content;
        if (!result) return null;

        const parsed = JSON.parse(result);
        return parsed.extracted_value;
    } catch (error) {
        console.error("OpenAI Extractor Error:", error);
        return null;
    }
}
