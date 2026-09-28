# IBM Bob 2.0 Hackathon Project
## Team Overview
We are a team from Ukraine. We joined the IBM Bob 2.0 Hackathon to challenge ourselves, gain new knowledge in frontend and web development, and explore how AI can optimize modern developer workflows. Our primary goal for this hackathon is to build a highly functional, user-centric application while getting hands-on experience with IBM Bob IDE's advanced capabilities.

---

# AI Debug: CI/CD Pipeline Analyzer

A Warp-inspired AI debugging utility designed to automatically diagnose and fix failing CI/CD pipelines. The tool parses raw error logs, looks up matching causes in the local `backend/knowledge/common_errors.md` reference, fetches failing code from GitHub when configured, and uses OpenRouter (OpenAI GPT-4o) to generate a structured root cause analysis and code fix. The local documentation lookup runs independently from the AI request and displays its highest-ranked matches as soon as they are available.

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

Create an API key in the [OpenRouter dashboard](https://openrouter.ai/keys), then create a `.env` file in the `backend` directory:

```env
OPENROUTER_API_KEY=your_openrouter_key_here
```

Keep this key private: do not commit it or expose it in frontend code. The backend reads it from `backend/.env` and uses it to authenticate requests to the OpenRouter Chat Completions API. The configured model is `openai/gpt-4o`.

Optionally, add your site's URL for OpenRouter attribution:

```env
OPENROUTER_HTTP_REFERER=https://your-site.example
```

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
5. Click **Debug with AI** to see matching local documentation causes alongside the OpenRouter analysis, error location, and suggested code fix.

The local lookup reads `backend/knowledge/common_errors.md` at backend startup, matches each entry's `Pattern` keywords against the submitted log, and ranks the results by keyword occurrence count. Run the backend tests with `npm test` from the `backend` directory.

## Author
* **Yehor Zhmurov**
