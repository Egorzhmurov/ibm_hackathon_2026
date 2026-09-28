const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
const envEncoding =
  fs.existsSync(envPath) &&
  fs.readFileSync(envPath).subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))
    ? 'utf16le'
    : 'utf8';
const envConfig = dotenv.config({ path: envPath, encoding: envEncoding });
if (
  !process.env.OPENROUTER_API_KEY?.trim() &&
  envConfig.parsed?.OPENROUTER_API_KEY?.trim()
) {
  process.env.OPENROUTER_API_KEY = envConfig.parsed.OPENROUTER_API_KEY.trim();
}
const express = require('express');
const cors = require('cors');
const { lookupAll: kbLookupAll } = require('./modules/kb');
const app = express();
const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim();

if (!openRouterApiKey) {
  console.error('[FATAL] OPENROUTER_API_KEY is not set in .env — all /api/debug requests will fail.');
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openai/gpt-4o';
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'Backend is running!' }));

app.post('/api/knowledge-base/lookup', (req, res) => {
  const log = req.body?.log;

  if (typeof log !== 'string' || !log.trim()) {
    return res.status(400).json({ error: 'Error log is required.' });
  }

  return res.json({ matches: kbLookupAll(log) });
});

app.post('/api/debug', async (req, res) => {
  const { log, errorLog, repository, githubToken } = req.body || {};
  const rawLog = typeof log === 'string' ? log : errorLog;

  if (typeof rawLog !== 'string' || !rawLog.trim()) {
    return res.status(400).json({ error: 'Error log is required.' });
  }

  if (!openRouterApiKey) {
    return res.status(503).json({ error: 'OpenRouter API is unavailable because OPENROUTER_API_KEY is not configured.' });
  }

  const stackMatch = rawLog.match(/\(([^)]+\.(?:js|ts|jsx|tsx|py|rb|java|go)):\d+:\d+\)/);
  const sourceFilePath = stackMatch ? stackMatch[1] : null;

  let rawCode = null;

  if (repository && sourceFilePath) {
    const headers = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Node.js',
    };
    if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`;

    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${repository}/contents/${sourceFilePath}`,
        { headers }
      );
      if (ghRes.ok) rawCode = await ghRes.text();
    } catch {
      // proceed without source context
    }
  }

  const sourceBlock = rawCode
    ? `\n\nThe relevant source file is \`${sourceFilePath}\`:\n\`\`\`\n${rawCode}\n\`\`\``
    : '';

  const prompt = `A CI/CD pipeline produced the following error log:

\`\`\`
${rawLog}
\`\`\`
${sourceBlock}

Produce a precise, actionable bug report following ALL of these rules:
1. Identify the single root cause — explain WHY it fails, not just WHAT failed.
2. List every fix step a developer must take, in order.
3. Show ONLY the changed lines (plus up to 2 lines of surrounding context) as "before" and "after" snippets.
4. In "location", give the exact file path and line number from the log or source (for example "src/server/routes/auth.js:47"). If it cannot be determined, use "Unknown location".
5. Return ONLY a valid JSON object with exactly these fields and types:
   - "location": string
   - "root_cause": string
   - "how_to_fix": array of strings
   - "code_change": object with string fields "before" and "after"
6. Use empty strings for both code_change values when no code change applies. Escape snippet newlines as JSON requires. Do not include markdown fences or any text outside the JSON object.

Required response shape:
{"location":"Unknown location","root_cause":"Concise technical explanation","how_to_fix":["Actionable step"],"code_change":{"before":"","after":""}}`;

  let aiResult;
  try {
    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI Debug: CI/CD Pipeline Analyzer',
        ...(process.env.OPENROUTER_HTTP_REFERER
          ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER }
          : {}),
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a senior software engineer and expert debugger.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const completion = await openRouterResponse.json();
    if (!openRouterResponse.ok) {
      const details = completion?.error?.message || `HTTP ${openRouterResponse.status}`;
      throw new Error(`OpenRouter request failed: ${details}`);
    }

    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('OpenRouter returned no message content.');
    }
    aiResult = JSON.parse(content);
    if (
      !aiResult ||
      typeof aiResult.location !== 'string' ||
      typeof aiResult.root_cause !== 'string' ||
      !Array.isArray(aiResult.how_to_fix) ||
      !aiResult.how_to_fix.every((step) => typeof step === 'string') ||
      !aiResult.code_change ||
      typeof aiResult.code_change.before !== 'string' ||
      typeof aiResult.code_change.after !== 'string'
    ) {
      throw new Error('OpenRouter returned an invalid debugging response.');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown OpenRouter API error';
    console.error('[/api/debug] OpenRouter request failed:', message);
    return res.status(502).json({ error: `OpenRouter analysis failed: ${message}` });
  }

  return res.json({
    location: aiResult.location || 'Unknown location',
    root_cause: aiResult.root_cause,
    how_to_fix: aiResult.how_to_fix,
    code_change: {
      before: aiResult.code_change.before,
      after: aiResult.code_change.after,
    },
  });
});

app.listen(PORT, () => console.log('Server is running on http://localhost:' + PORT));
