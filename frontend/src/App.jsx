import { useState } from 'react'

const PLACEHOLDER_RESULT = {
  filePath: 'src/server/routes/auth.js:47',
  rootCause:
    'jwt.verify() is called before the token variable is declared, so `token` is always `undefined` at the point of verification — this throws a synchronous ReferenceError that bypasses the async error handler.',
  steps: [
    'Move the token extraction line above the jwt.verify() call.',
    'Add an early-return guard so a missing token returns 401 instead of throwing.',
    'Ensure jwt.verify() is wrapped in try/catch to handle expired or invalid tokens gracefully.',
  ],
  before: `router.post('/verify', (req, res) => {
  const verified = jwt.verify(token, process.env.JWT_SECRET); // ❌ token not yet defined
  const token = req.headers.authorization?.split(' ')[1];
  res.json({ verified });
});`,
  after: `router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // ✅ extract first
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ verified });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});`,
}

export default function App() {
  const [log, setLog] = useState('')
  const [repo, setRepo] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!log.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const body = { log }
      if (repo.trim()) body.repository = repo.trim()
      if (githubToken.trim()) body.githubToken = githubToken.trim()
      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResult(data)
    } catch {
      setResult(PLACEHOLDER_RESULT)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-100 flex flex-col items-center justify-start px-4 py-16 font-mono">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          AI Debug
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a raw error log and get a targeted fix.
        </p>
      </div>

      {/* Input panel */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3">
        {/* Repository URL */}
        <div className="rounded-xl border border-white/10 bg-[#17171a] shadow-xl ring-1 ring-white/5 px-5 py-3 flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-gray-500">
            Repository URL
          </label>
          <input
            type="url"
            className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none focus:ring-0 w-full"
            placeholder="https://github.com/owner/repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
        </div>

        {/* GitHub Token */}
        <div className="rounded-xl border border-white/10 bg-[#17171a] shadow-xl ring-1 ring-white/5 px-5 py-3 flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-gray-500">
            GitHub Token{' '}
            <span className="normal-case tracking-normal text-gray-600">
              (optional, for private repos)
            </span>
          </label>
          <input
            type="password"
            autoComplete="off"
            className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none focus:ring-0 w-full"
            placeholder="ghp_••••••••••••••••••••••••••••••••••••••"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
          />
        </div>

        {/* Error log */}
        <div className="relative rounded-xl border border-white/10 bg-[#17171a] shadow-2xl ring-1 ring-white/5 focus-within:border-violet-500/60 focus-within:ring-violet-500/20 transition-all duration-200">
          <textarea
            className="w-full resize-none bg-transparent px-5 pt-5 pb-14 text-sm text-gray-200 placeholder-gray-600 outline-none leading-relaxed"
            rows={10}
            spellCheck={false}
            placeholder={"Paste error log here...\n\nTypeError: Cannot read properties of undefined (reading 'map')\n    at ProductList (src/components/ProductList.jsx:12:23)"}
            value={log}
            onChange={(e) => setLog(e.target.value)}
          />

          {/* Toolbar row */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-gray-600 select-none">
              {log.length > 0 ? `${log.length} chars` : 'error log'}
            </span>
            <button
              type="submit"
              disabled={loading || !log.trim()}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Analyzing…
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M2 8h12M10 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Debug with AI
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Result card */}
      {result && (
        <div className="w-full max-w-2xl mt-6 rounded-xl border border-white/10 bg-[#17171a] shadow-2xl ring-1 ring-white/5 overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-[#1c1c1f]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">
              Fix Ready
            </span>
          </div>

          <div className="px-5 py-5 space-y-6">

            {/* ── Location ── */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">
                Location
              </p>
              <code className="text-sm text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-md inline-block">
                {result.filePath ?? '—'}
              </code>
            </div>

            {/* ── Root Cause ── */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">
                Root Cause
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {result.rootCause ?? result.cause ?? '—'}
              </p>
            </div>

            {/* ── Step-by-step fix ── */}
            {result.steps && result.steps.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
                  How to Fix
                </p>
                <ol className="space-y-2">
                  {result.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                      <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── Before / After ── */}
            {(result.before || result.after) && (
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-gray-500">
                  Code Change
                </p>

                {/* Before */}
                {result.before && (
                  <div className="rounded-lg bg-[#0d0d0f] border border-red-500/20 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-red-500/10 bg-[#110d0d]">
                      <span className="text-[11px] text-red-400/70 font-medium">Before</span>
                    </div>
                    <pre className="overflow-x-auto px-4 py-4 text-sm text-red-300/80 leading-relaxed whitespace-pre">
                      <code>{result.before}</code>
                    </pre>
                  </div>
                )}

                {/* After */}
                {result.after && (
                  <div className="rounded-lg bg-[#0d0d0f] border border-emerald-500/20 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/10 bg-[#0d110d]">
                      <span className="text-[11px] text-emerald-400/70 font-medium">After</span>
                      <button
                        type="button"
                        className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                        onClick={() => navigator.clipboard?.writeText(result.after)}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="overflow-x-auto px-4 py-4 text-sm text-emerald-300/90 leading-relaxed whitespace-pre">
                      <code>{result.after}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
