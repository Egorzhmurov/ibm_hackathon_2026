require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'Backend is running!' }));

app.post('/api/debug', async (req, res) => {
  const { log, repo, token } = req.body;

  if (!log || !repo) {
    return res.status(400).json({ error: '`log` and `repo` are required.' });
  }

  // Extract a file path from the first stack-trace line, e.g. "at foo (src/bar.js:12:5)"
  const stackMatch = log.match(/\(([^)]+\.(?:js|ts|jsx|tsx|py|rb|java|go)):\d+:\d+\)/);
  const filePath = stackMatch ? stackMatch[1] : null;

  if (!filePath) {
    return res.status(422).json({ error: 'Could not extract a file path from the log.' });
  }

  const headers = {
    'Accept': 'application/vnd.github.v3.raw',
    'User-Agent': 'Node.js',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const githubUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  let rawCode;
  try {
    const ghRes = await fetch(githubUrl, { headers });
    if (!ghRes.ok) {
      return res.status(ghRes.status).json({
        error: `GitHub API returned ${ghRes.status} for ${filePath}`,
      });
    }
    rawCode = await ghRes.text();
  } catch (err) {
    return res.status(502).json({ error: `Failed to reach GitHub API: ${err.message}` });
  }

  const prompt = `You are an expert debugger. A CI/CD pipeline produced the following error log:

\`\`\`
${log}
\`\`\`

The relevant source file is \`${filePath}\`:

\`\`\`
${rawCode}
\`\`\`

Respond with ONLY a raw JSON object — no markdown fences, no extra text — matching this exact shape:
{"cause":"<concise string explaining the root error>","fix":"<formatted code block resolving it>"}`;

  let aiResult;
  try {
    const aiRes = await model.generateContent(prompt);
    const text = aiRes.response.text().trim();
    // Strip accidental markdown fences if the model adds them despite instructions
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    aiResult = JSON.parse(cleaned);
  } catch (err) {
    return res.status(502).json({ error: `AI response parse failed: ${err.message}` });
  }

  return res.json({ filePath, cause: aiResult.cause, fix: aiResult.fix });
});

app.listen(PORT, () => console.log('Server is running on http://localhost:' + PORT));
