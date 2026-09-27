/**
 * CodeBlock
 * Renders a single labelled code snippet (Before or After).
 * Props:
 *   label      {string}    — display label shown in the header bar
 *   code       {string}    — the code text to display
 *   variant    {'before'|'after'} — controls colour scheme
 *   copyable   {boolean}   — when true, shows a Copy button
 */
export default function CodeBlock({ label, code, variant = 'after', copyable = false }) {
  const isBefore = variant === 'before'

  const borderColor  = isBefore ? 'border-red-500/20'     : 'border-emerald-500/20'
  const headerBg     = isBefore ? 'bg-[#110d0d]'          : 'bg-[#0d110d]'
  const headerBorder = isBefore ? 'border-red-500/10'     : 'border-emerald-500/10'
  const labelColor   = isBefore ? 'text-red-400/70'       : 'text-emerald-400/70'
  const codeColor    = isBefore ? 'text-red-300/80'       : 'text-emerald-300/90'

  return (
    <div className={`rounded-lg bg-[#0d0d0f] border ${borderColor} overflow-hidden`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${headerBorder} ${headerBg}`}>
        <span className={`text-[11px] font-medium ${labelColor}`}>{label}</span>
        {copyable && (
          <button
            type="button"
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            onClick={() => navigator.clipboard?.writeText(code)}
          >
            Copy
          </button>
        )}
      </div>
      <pre className={`overflow-x-auto px-4 py-4 text-sm ${codeColor} leading-relaxed whitespace-pre`}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
