import { useState } from 'react'
import Header      from './components/Header/Header'
import DebugForm   from './components/DebugForm/DebugForm'
import ErrorBanner from './components/ErrorBanner/ErrorBanner'
import ResultCard  from './components/ResultCard/ResultCard'

export default function App() {
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  // loading is owned by DebugForm; we track it here only to prevent
  // the result card from flashing the previous result while a new
  // request is in flight.
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-100 flex flex-col items-center justify-start px-4 py-16 font-mono">

      <Header />

      <DebugForm
        onResult={setResult}
        onError={setError}
        onLoadingChange={setLoading}
      />

      <ErrorBanner message={error} />

      {!loading && <ResultCard result={result} />}

    </div>
  )
}
