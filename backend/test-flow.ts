import axios from "axios";

const API_URL = "http://localhost:3001";

async function testFlow() {
    console.log("Starting E2E Chatbot Flow Test...");
    try {
        // 1. Signup
        console.log("\\n[1] Signing up...");
        const signupData = {
            first_name: "Test",
            last_name: "User",
            email: "testuser2@example.com",
            password: "password123",
            confirm_password: "password123"
        };
        try {
            await axios.post(`${API_URL}/auth/signup`, signupData);
            console.log("Signup successful!");
        } catch (e: any) {
            console.log("Signup returned:", e.response?.data?.error || e.message);
        }

        // 2. Login
        console.log("\\n[2] Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: "testuser2@example.com",
            password: "password123"
        });
        const token = loginRes.data.token;
        console.log("Login successful! Token received.");

        // Setup Auth Header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // 3. Init Chatbot
        console.log("\\n[3] Initializing Chatbot...");
        const initRes = await axios.get(`${API_URL}/chatbot/init`);
        console.log("Bot:", initRes.data.messages.join(" "));

        // 4. Create Record via NLP
        console.log("\\n[4] Sending Create Message...");
        const createRes = await axios.post(`${API_URL}/chatbot/message`, {
            message: "I want to add a new job at Microsoft from 2022-01-01 to present"
        });
        console.log("Bot (Create):", createRes.data.messages.join(" "));

        // 5. Check Records
        console.log("\\n[5] Fetching Employment Records...");
        const recordsRes = await axios.get(`${API_URL}/employment`);
        const records = recordsRes.data;
        console.log(`Found ${records.length} records.`);
        if (records.length > 0) {
            console.log("Latest Record:", records[0]);
        }

        // 6. Test 'Update existing' without ID
        console.log("\\n[6] Sending Update Message without ID...");
        const updateReq = await axios.post(`${API_URL}/chatbot/message`, {
            message: "Update existing"
        });
        console.log("Bot (Update w/o ID):", updateReq.data.messages.join(" "));

    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testFlow();
