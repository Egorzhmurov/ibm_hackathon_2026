# IBM Bob 2.0 Hackathon Project

## Team Overview
We are a team from Ukraine. We joined the IBM Bob 2.0 Hackathon to challenge ourselves, gain new knowledge in frontend and web development, and explore how AI can optimize modern developer workflows. Our primary goal for this hackathon is to build a highly functional, user-centric application while getting hands-on experience with IBM Bob IDE's advanced capabilities.

---

# AI Debug: CI/CD Pipeline Analyzer

A Warp-inspired AI debugging utility designed to automatically diagnose and fix failing CI/CD pipelines. The tool parses raw error logs, fetches the failing code directly from GitHub, and uses OpenRouter (OpenAI GPT-4o) to generate a structured root cause analysis along with a ready-to-use code fix.

## Tech Stack
* **Frontend:** React (Vite), Tailwind CSS
* **Backend:** Node.js, Express
* **AI Engine:** OpenRouter Chat Completions API (`openai/gpt-4o`)
* **Integrations:** GitHub REST API

## Prerequisites
* [Node.js](https://nodejs.org/) (v20+)
* An [OpenRouter API key](https://openrouter.ai/keys)
* A GitHub Personal Access Token (PAT) for analyzing private repositories (optional)

## Local Setup

### 1. Backend Configuration
Navigate to the backend directory and install the required dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in `backend` and add your OpenRouter API key:
`OPENROUTER_API_KEY=your_openrouter_key_here`

Optionally set `OPENROUTER_HTTP_REFERER` to your site's URL for OpenRouter attribution.

Start the Express server:
```bash
node index.js
```
The server will start on `http://localhost:5000`.

### 2. Frontend Configuration
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## Usage Workflow
1. Open the web interface at `http://localhost:5173`.
2. Enter the target GitHub repository (e.g., `owner/repo`).
3. (Optional) Provide a GitHub token if the repository is private.
4. Paste the raw CI/CD error log into the command-palette input.
5. Click **Debug with AI** to instantly view the error location, root cause, and the suggested code fix from OpenRouter.

## Author
* **Yegor Zhmurov**