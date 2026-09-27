/**
 * KbFallbackCard
 *
 * Shown when the Gemini AI is unavailable (timeout, API key missing, parse
 * failure) but a local knowledge-base entry matched the submitted error log.
 *
 * Visual language: amber/yellow accent to distinguish it clearly from the
 * green "Fix Ready" AI result card and the red ErrorBanner.
 *
 * Props:
 *   result {object} — shape: { kbTitle, kbRef, kbFix, rootCause, filePath? }
 *                     (present when result.source === 'kb')
 */
export default function KbFallbackCard({ result }) {
  if (!result || result.source !== 'kb') return null

  // Parse the kbFix text into numbered step lines for structured rendering.
  // The MD fix block looks like "1. Do X\n2. Do Y" — split on numbered items.
  const steps = result.kbFix
    ? result.kbFix
        .split(/\n/)
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
    : []

  return (
    <div className="w-full max-w-2xl mt-6 rounded-xl border border-amber-500/30 bg-[#17171a] shadow-2xl ring-1 ring-amber-500/10 overflow-hidden">

      {/* Card header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/10 bg-[#1c1a14]">
        <svg
          className="h-3.5 w-3.5 text-amber-400 flex-shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 5v4M8 10.5v.5" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-medium text-amber-400 uppercase tracking-widest">
          Local Docs — AI Unavailable
        </span>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Matched pattern ── */}
        {result.kbTitle && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">
              Matched Pattern
            </p>
            <span className="text-sm text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md inline-block">
              {result.kbTitle}
            </span>
          </div>
        )}

        {/* ── Location (from stack trace) ── */}
        {result.filePath && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">
              Location
            </p>
            <code className="text-sm text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-md inline-block">
              {result.filePath}
            </code>
          </div>
        )}

        {/* ── Common root cause from KB ── */}
        {result.rootCause && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">
              Common Root Cause
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {result.rootCause}
            </p>
          </div>
        )}

        {/* ── Fix steps from KB ── */}
        {steps.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
              Suggested Fix Steps
            </p>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                  <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Official docs link ── */}
        {result.kbRef && (
          <div className="pt-1 border-t border-white/5">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
              Documentation
            </p>
            <a
              href={result.kbRef}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5v5M8.5 8.5 14 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {result.kbRef}
            </a>
          </div>
        )}

        {/* ── Note explaining the fallback ── */}
        <p className="text-[11px] text-gray-600 leading-relaxed border-t border-white/5 pt-3">
          The Gemini AI analysis is currently unavailable. The information above was
          retrieved from the local knowledge base.
          Fix your <code className="text-gray-500">GEMINI_API_KEY</code> in{' '}
          <code className="text-gray-500">backend/.env</code> to enable full AI analysis.
        </p>

      </div>
    </div>
  )
}
