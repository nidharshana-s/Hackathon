import { useState } from 'react'

export default function Login({ onLogin, apiBaseUrl }) {
  const [operatorId, setOperatorId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/operator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId.trim(), password }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || `Login failed (${res.status})`)
      }

      onLogin(payload.token, payload.operator_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="panel">
        <div className="topbar">
          <div>
            <div className="title">Operator Login</div>
            <div className="hint">Enter your operator credentials to start check-in.</div>
          </div>
          <div className="badge">OPS</div>
        </div>

        <form onSubmit={submit} style={{ marginTop: 16 }}>
          <div className="row">
            <div className="col">
              <label>Operator ID</label>
              <input
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="OP101"
                autoComplete="username"
              />
            </div>
            <div className="col">
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                type="password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div style={{ marginTop: 16 }}>
            <button type="submit" disabled={loading || !operatorId || !password}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

