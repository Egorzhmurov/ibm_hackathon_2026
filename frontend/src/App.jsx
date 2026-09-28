import { useState } from 'react'
import Header          from './components/Header/Header'
import DebugForm       from './components/DebugForm/DebugForm'
import ErrorBanner     from './components/ErrorBanner/ErrorBanner'
import ResultCard      from './components/ResultCard/ResultCard'
import KnowledgeBaseCard from './components/KnowledgeBaseCard/KnowledgeBaseCard'

export default function App() {
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const [kbMatches, setKbMatches] = useState([])
  const [kbStatus, setKbStatus] = useState('idle')
  const [kbError, setKbError] = useState(null)
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
        onKbResults={setKbMatches}
        onKbStatusChange={setKbStatus}
        onKbError={setKbError}
      />

      <ErrorBanner message={error} />

      <KnowledgeBaseCard matches={kbMatches} status={kbStatus} error={kbError} />
      {!loading && result && <ResultCard result={result} />}

    </div>
  )
}
