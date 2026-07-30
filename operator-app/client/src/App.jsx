import { useEffect, useState } from 'react'
import Login from './components/Login.jsx'
import OperatorCheckin from './components/OperatorCheckin.jsx'

const defaultApiBaseUrl = 'http://localhost:4100'

function getApiBaseUrl() {
  // Vite exposes env vars prefixed with VITE_*
  return import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl
}

export default function App() {
  const apiBaseUrl = getApiBaseUrl()
  const [token, setToken] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const saved = localStorage.getItem('operator_token')
        if (!saved) {
          if (!cancelled) setLoading(false)
          return
        }

        const res = await fetch(`${apiBaseUrl}/api/operator/me`, {
          headers: { Authorization: `Bearer ${saved}` },
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || `Auth failed (${res.status})`)

        if (!cancelled) {
          setToken(saved)
          setOperatorId(payload?.operator_id || '')
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          localStorage.removeItem('operator_token')
          setToken('')
          setOperatorId('')
          setError(err instanceof Error ? err.message : 'Auth failed')
          setLoading(false)
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl])

  function handleLogout() {
    localStorage.removeItem('operator_token')
    setToken('')
    setOperatorId('')
    setError('')
  }

  return (
    <div className="app">
      {loading ? (
        <div className="container">
          <div className="panel">Loading...</div>
        </div>
      ) : token ? (
        <div>
          <div style={{ padding: '16px 0 0' }}>
            <div className="container" style={{ paddingTop: 0 }}>
              <div className="topbar">
                <div className="badge">Operator Session Active</div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          <OperatorCheckin token={token} operatorId={operatorId} apiBaseUrl={apiBaseUrl} />
        </div>
      ) : (
        <>
          {error && (
            <div className="container">
              <div className="error">{error}</div>
            </div>
          )}
          <Login
            apiBaseUrl={apiBaseUrl}
            onLogin={(t, opId) => {
              localStorage.setItem('operator_token', t)
              setToken(t)
              setOperatorId(opId)
            }}
          />
        </>
      )}
    </div>
  )
}

