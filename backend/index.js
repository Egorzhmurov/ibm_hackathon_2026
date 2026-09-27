require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { lookup: kbLookup } = require('./modules/kb');
const app = express();

if (!process.env.GEMINI_API_KEY) {
  console.error('[FATAL] GEMINI_API_KEY is not set in .env — all /api/debug requests will fail.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'Backend is running!' }));

app.post('/api/debug', async (req, res) => {
  const { log, errorLog, repository, githubToken } = req.body;
  const rawLog = log || errorLog;

  if (!rawLog || !rawLog.trim()) {
    return res.status(400).json({ error: 'Error log is required.' });
  }

  const stackMatch = rawLog.match(/\(([^)]+\.(?:js|ts|jsx|tsx|py|rb|java|go)):\d+:\d+\)/);
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

  // Knowledge-base pre-flight: enrich the prompt with a local KB match if one exists.
  // This is completely non-blocking — if lookup returns null the block is simply omitted.
  const kbHit = kbLookup(rawLog);
  const kbBlock = kbHit
    ? `\n\nLocal knowledge base matched the pattern "${kbHit.title}":\n` +
      `- Known root cause: ${kbHit.rootCause}\n` +
      `- Reference: ${kbHit.ref}\n` +
      `Use this as supporting context only — derive your answer from the actual log above.`
    : '';

  // Strict schema example shown inline so the model can follow it exactly.
  const prompt = `You are a senior software engineer and expert debugger.
A CI/CD pipeline produced the following error log:

\`\`\`
${rawLog}
\`\`\`
${sourceBlock}
${kbBlock}
Produce a precise, actionable bug report following ALL of these rules:

1. Identify the single root cause — explain WHY it fails, not just WHAT failed.
2. List every fix step a developer must take, in order.
3. Show ONLY the changed lines (plus up to 2 lines of surrounding context) as "before" and "after" snippets.
4. In "before" and "after" values use \\n (two characters: backslash + n) for every newline — do NOT use real newlines inside a JSON string value.

CRITICAL: output ONLY the JSON object below — no markdown fences, no prose, nothing else.
Every field is required. Use JSON null (not the string "null") when filePath cannot be determined.

{"filePath":"<file:line from stack trace, or JSON null>","rootCause":"<one sentence: what is wrong and WHY>","steps":["<step 1>","<step 2>"],"before":"<broken code — escape newlines as \\\\n>","after":"<fixed code — escape newlines as \\\\n>"}`;

  let aiResult;
  try {
    const aiRes = await model.generateContent(prompt);
    const raw = aiRes.response.text();

    // Extract the outermost JSON object — immune to any prose or fences the model wraps around it.
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object found in model response');
    }
    const jsonStr = raw.slice(start, end + 1);
    aiResult = JSON.parse(jsonStr);
  } catch (err) {
    console.error('[/api/debug] parse error:', err.message);
    console.error('[/api/debug] raw model text:', typeof raw !== 'undefined' ? JSON.stringify(raw) : '(no response)');
    return res.status(502).json({ error: `AI response parse failed: ${err.message}` });
  }

  // Normalise: the model sometimes returns the string "null" instead of JSON null.
  const resolvedFilePath =
    aiResult.filePath && aiResult.filePath !== 'null' ? aiResult.filePath : filePath;

  return res.json({
    filePath:  resolvedFilePath  ?? null,
    rootCause: aiResult.rootCause ?? '',
    steps:     Array.isArray(aiResult.steps) ? aiResult.steps : [],
    before:    aiResult.before ?? '',
    after:     aiResult.after  ?? '',
  });
});

app.listen(PORT, () => console.log('Server is running on http://localhost:' + PORT));
