function getFixSteps(fix) {
  return fix
    ? fix
        .split(/\r?\n/)
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
    : []
}

export default function KnowledgeBaseCard({ matches, status, error }) {
  if (status === 'idle') return null

  return (
    <section
      className="w-full max-w-2xl mt-6 rounded-xl border border-amber-500/30 bg-[#17171a] shadow-2xl ring-1 ring-amber-500/10 overflow-hidden"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/10 bg-[#1c1a14]">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <h2 className="text-xs font-medium text-amber-400 uppercase tracking-widest">
          Local Documentation Matches
        </h2>
        <span className="ml-auto text-[11px] text-gray-500">common_errors.md</span>
      </div>

      <div className="px-5 py-5 space-y-5">
        {status === 'loading' && (
          <p className="text-sm text-gray-400">Searching local documentation…</p>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-300" role="alert">{error}</p>
        )}

        {status === 'success' && matches.length === 0 && (
          <p className="text-sm text-gray-400">
            No matching causes were found in the local documentation.
          </p>
        )}

        {status === 'success' && matches.map((match) => {
          const steps = getFixSteps(match.fix)

          return (
            <article key={match.title} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-amber-300">{match.title}</h3>
                <span className="text-[11px] text-gray-500">
                  {match.matchCount} keyword {match.matchCount === 1 ? 'match' : 'matches'}
                </span>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">{match.rootCause}</p>

              {match.matchedKeywords?.length > 0 && (
                <p className="text-xs text-gray-500">
                  Matched: {match.matchedKeywords.join(', ')}
                </p>
              )}

              {steps.length > 0 && (
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                  {steps.map((step, index) => <li key={`${match.title}-${index}`}>{step}</li>)}
                </ol>
              )}

              {match.ref && (
                <a
                  href={match.ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Documentation reference
                </a>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
