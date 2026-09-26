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
  const { errorLog, repository, githubToken } = req.body;

  if (!errorLog || !errorLog.trim()) {
    return res.status(400).json({ error: 'Error log is required.' });
  }

  const stackMatch = errorLog.match(/\(([^)]+\.(?:js|ts|jsx|tsx|py|rb|java|go)):\d+:\d+\)/);
  const filePath = stackMatch ? stackMatch[1] : null;

  let rawCode = null;

  if (repository && filePath) {
    const headers = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Node.js',
    };
    if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`;

    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${repository}/contents/${filePath}`,
        { headers }
      );
      if (ghRes.ok) rawCode = await ghRes.text();
    } catch {
      // proceed without source context
    }
  }

  const sourceBlock = rawCode
    ? `\n\nThe relevant source file is \`${filePath}\`:\n\`\`\`\n${rawCode}\n\`\`\``
    : '';

  const prompt = `You are an expert debugger. A CI/CD pipeline produced the following error log:

\`\`\`
${errorLog}
\`\`\`
${sourceBlock}
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
