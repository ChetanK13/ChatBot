# Chatbot-Based Employment History Manager

This is a complete full-stack project created with Fastify (TypeScript), TypeORM, React (Vite+TS) and TailwindCSS.

## Prerequisites
- Node.js (v20+)
- MySQL Server

## Getting Started

### 1. Database Configuration
1. Make sure you have a MySQL server running properly.
2. Create a database named `chatbot_hrms`:
   ```sql
   CREATE DATABASE IF NOT EXISTS chatbot_hrms;
   ```
3. Navigate to the `backend` folder and copy the `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
4. Adjust the `DB_USER` and `DB_PASSWORD` in the `backend/.env` file with your MySQL credentials.

### 2. Backend Setup
The backend runs on port 3000 by default.
1. Run `npm install` inside the `backend` directory.
2. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
The frontend runs on port 5173 by default.
1. Open a new terminal.
2. Navigate to the `frontend` folder.
3. Run `npm install`.
4. Start the frontend:
   ```bash
   npm run dev
   ```

### Usage
- Visit `http://localhost:5173` to sign up and login.
- Navigate to the **Chatbot** page to interact with the Regex-based NLP logic that will guide you through adding, updating, and removing your employment records.
# ChatBot
