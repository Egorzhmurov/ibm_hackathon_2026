/**
 * ErrorBanner
 * Renders a red-tinted inline alert when the API call fails.
 * Props:
 *   message {string} — the error text to display
 */
export default function ErrorBanner({ message }) {
  if (!message) return null

  return (
    <div className="w-full max-w-2xl mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-start gap-3">
      <svg
        className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-red-300 leading-relaxed">{message}</p>
    </div>
  )
}
