import { useEffect, useState } from 'react'

const API = 'http://localhost:5000'

function fmt_date(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmt_time(minutes) {
  if (!minutes) return '—'
  const h = minutes / 60
  return h >= 1 ? `${h.toFixed(1)} h` : `${minutes} min`
}

export default function App() {
  const [repo, setRepo]               = useState('')
  const [errorLog, setErrorLog]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [history, setHistory]         = useState([])
  const [historyReady, setHistoryReady] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/logs`)
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setHistoryReady(true))
  }, [])

  const totalMinutes = history.reduce((s, l) => s + (l.timeSavedMinutes || 0), 0)

  async function submit(e) {
    e.preventDefault()
    if (!errorLog.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res  = await fetch(`${API}/api/debug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository: repo.trim(), errorLog }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResult(data)
      setHistory(prev => [{
        _id: Date.now(),
        repository: repo.trim() || '—',
        rootCause: data.rootCause ?? data.cause ?? '',
        timeSavedMinutes: 0,
        createdAt: new Date().toISOString(),
      }, ...prev])
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Network Error: Cannot connect to backend. Please ensure the Node.js server is running on port 5000.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      <header className="bg-gradient-to-r from-cyan-400 to-purple-500 px-8 py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">AI Debug CI/CD</h1>
        <p className="mt-1 text-sm text-white/70">Paste an error log. Get a targeted fix.</p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        <section className="grid grid-cols-2 gap-4">
          {[
            { label: 'Errors Analyzed', value: historyReady ? history.length : '—' },
            { label: 'Time Saved',      value: historyReady ? fmt_time(totalMinutes) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{label}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                {value}
              </p>
            </div>
          ))}
        </section>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 outline-none focus:border-cyan-400 transition-colors"
            placeholder="Repository (optional) — owner/repo"
            value={repo}
            onChange={e => setRepo(e.target.value)}
          />
          <textarea
            rows={10}
            spellCheck={false}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono placeholder-slate-400 outline-none focus:border-cyan-400 transition-colors resize-none leading-relaxed"
            placeholder="Paste raw CI/CD error log…"
            value={errorLog}
            onChange={e => setErrorLog(e.target.value)}
          />
          {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading || !errorLog.trim()}
            className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-all"
          >
            {loading && (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {loading ? 'Analyzing…' : 'Debug with AI'}
          </button>
        </form>

        {result && (
          <section className="grid grid-cols-3 gap-4">
            {[
              { label: 'Location',      value: result.location      ?? result.filePath  ?? '—' },
              { label: 'Root Cause',    value: result.rootCause     ?? result.cause     ?? '—' },
              { label: 'Suggested Fix', value: result.suggestedFix  ?? result.fix       ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                    {label}
                  </p>
                </div>
                <div className="bg-slate-900 m-3 rounded-lg p-3">
                  <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {value}
                  </pre>
                </div>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3">History</h2>
          {!historyReady ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">No sessions recorded.</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-slate-400 font-normal">Repository</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-slate-400 font-normal">Cause</th>
                    <th className="text-right px-5 py-3 text-xs uppercase tracking-widest text-slate-400 font-normal">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(entry => (
                    <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{entry.repository || '—'}</td>
                      <td className="px-5 py-3 text-slate-700 max-w-xs truncate">{entry.rootCause || '—'}</td>
                      <td className="px-5 py-3 text-right text-xs text-slate-400 whitespace-nowrap">{fmt_date(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
