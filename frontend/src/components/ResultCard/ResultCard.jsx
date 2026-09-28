import CodeBlock from './CodeBlock'

/**
 * ResultCard
 * Displays the structured AI analysis result.
 * Props:
 *   result {object} — shape: { location, root_cause, how_to_fix[], code_change }
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
            {result.location || 'Unknown location'}
          </code>
        </div>

        {/* ── Root Cause ── */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">
            Root Cause
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {result.root_cause || '—'}
          </p>
        </div>

        {/* ── Step-by-step fix ── */}
        {result.how_to_fix && result.how_to_fix.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
              How to Fix
            </p>
            <ol className="space-y-2">
              {result.how_to_fix.map((step, i) => (
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
        {(result.code_change?.before || result.code_change?.after) && (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-gray-500">
              Code Change
            </p>
            {result.code_change.before && (
              <CodeBlock label="Before" code={result.code_change.before} variant="before" />
            )}
            {result.code_change.after && (
              <CodeBlock label="After" code={result.code_change.after} variant="after" copyable />
            )}
          </div>
        )}

      </div>
    </div>
  )
}
