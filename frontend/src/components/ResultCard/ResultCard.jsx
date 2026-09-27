import CodeBlock from './CodeBlock'

/**
 * ResultCard
 * Displays the structured AI analysis result.
 * Props:
 *   result {object} — shape: {
 *     filePath, rootCause, steps[], before, after,
 *     kbTitle?, kbRef?, kbFix?   ← present when KB matched
 *   }
 */
export default function ResultCard({ result }) {
  if (!result) return null

  return (
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
            {result.before && (
              <CodeBlock label="Before" code={result.before} variant="before" />
            )}
            {result.after && (
              <CodeBlock label="After" code={result.after} variant="after" copyable />
            )}
          </div>
        )}

        {/* ── KB Reference ── */}
        {result.kbRef && (
          <div className="rounded-lg border border-white/5 bg-[#111113] px-4 py-3 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-gray-500">
              Knowledge Base Match
              {result.kbTitle && (
                <span className="ml-2 normal-case tracking-normal text-gray-600">
                  — {result.kbTitle}
                </span>
              )}
            </p>
            {result.kbFix && (
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                {result.kbFix}
              </p>
            )}
            <a
              href={result.kbRef}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5v5M8.5 8.5 14 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Official documentation
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
