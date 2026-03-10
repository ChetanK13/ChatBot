import axios from "axios";

const API_URL = "http://localhost:3001";

async function testExtract() {
    console.log("Starting Extract Flow Test...");
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: "testuser2@example.com",
            password: "password123"
        });
        const token = loginRes.data.token;
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        console.log("\\n[1] Starting Create Flow - Sending 'create new employment'");
        let res = await axios.post(`${API_URL}/chatbot/message`, { message: "create new employment" });
        console.log("Bot:", res.data.messages[0]);

        console.log("\\n[2] Sending natural conversational company name: 'I work at Apple'");
        res = await axios.post(`${API_URL}/chatbot/message`, { message: "I work at Apple" });
        console.log("Bot:", res.data.messages[0]);

        console.log("\\n[3] Sending natural start date: 'I started there in jan 2022'");
        res = await axios.post(`${API_URL}/chatbot/message`, { message: "I started there in jan 2022" });
        console.log("Bot:", res.data.messages[0]);

        console.log("\\n[4] Sending natural end date: 'I still work there currently'");
        res = await axios.post(`${API_URL}/chatbot/message`, { message: "I still work there currently" });
        console.log("Bot:", res.data.messages[0]);

    } catch (e: any) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

testExtract();
