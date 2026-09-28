import { useState } from 'react'

/**
 * DebugForm
 * Owns the three input fields (log, repo, githubToken) and the submit logic.
 * Calls onResult(data) on success and onError(message) on failure,
 * and notifies the parent of loading state changes via onLoadingChange(bool).
 *
 * Props:
 *   onResult       {(data: object) => void}
 *   onError        {(message: string) => void}
 *   onLoadingChange {(loading: boolean) => void}
 */
export default function DebugForm({
  onResult,
  onError,
  onLoadingChange,
  onKbResults,
  onKbStatusChange,
  onKbError,
}) {
  const [log, setLog]               = useState('')
  const [repo, setRepo]             = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken]   = useState(false)
  const [loading, setLoading]       = useState(false)

  function setLoadingState(val) {
    setLoading(val)
    onLoadingChange(val)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!log.trim()) return

    onResult(null)
    onError(null)
    onKbResults([])
    onKbError(null)
    onKbStatusChange('loading')
    setLoadingState(true)

    fetch('/api/knowledge-base/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: log.trim() }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        if (!Array.isArray(data.matches)) {
          throw new Error('The local documentation lookup returned an invalid response.')
        }
        onKbResults(data.matches)
        onKbStatusChange('success')
      })
      .catch((err) => {
        onKbError(
          err instanceof TypeError
            ? 'Cannot reach the backend for local documentation lookup.'
            : err.message
        )
        onKbStatusChange('error')
      })

    try {
      const body = { log: log.trim() }
      if (repo.trim()) body.repository = repo.trim()
      if (githubToken.trim()) body.githubToken = githubToken.trim()

      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      onResult(data)
    } catch (err) {
      onError(
        err instanceof TypeError
          ? 'Cannot reach the backend. Make sure the server is running on port 5000.'
          : err instanceof Error
            ? err.message
            : String(err)
      )
    } finally {
      setLoadingState(false)
    }
  }

  return (
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
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-widest text-gray-500">
            GitHub Token{' '}
            <span className="normal-case tracking-normal text-gray-600">
              (optional, for private repos)
            </span>
          </label>
          {githubToken && (
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors select-none"
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        <input
          type={showToken ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none focus:ring-0 w-full"
          placeholder="ghp_••••••••••••••••••••••••••••••••••••••"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
        />
      </div>

      {/* Error log textarea */}
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
  )
}
