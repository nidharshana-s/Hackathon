import { useState } from 'react'
import { QrReader } from 'react-qr-reader'

function parseQrText(text) {
  const raw = String(text || '').trim()
  if (!raw) return { equipmentId: '', type: '' }

  // Support JSON payload: {"equipmentId":"EQX1001","type":"Excavator"}
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const obj = JSON.parse(raw)
      return {
        equipmentId: String(obj.equipmentId || obj.equipment_id || '').trim(),
        type: String(obj.type || '').trim(),
      }
    } catch {
      // fallthrough
    }
  }

  // Support delimiter payload: "EQX1001|Excavator" or "EQX1001,Excavator"
  const delim = raw.includes('|') ? '|' : raw.includes(',') ? ',' : null
  if (delim) {
    const [equipmentId, type] = raw.split(delim).map((s) => s.trim())
    return { equipmentId, type }
  }

  // Support label payloads:
  // "Equipment ID: EQX1012 Type: Crane" or "Equipment ID: EQX1012Type: Crane"
  const normalized = raw.replace(/\s+/g, ' ')
  const typeLabelMatch = normalized.match(/type\s*[:=-]?\s*(.+)$/i)
  const equipmentLabelMatch = normalized.match(/equipment\s*id\s*[:=-]?\s*(.+?)(?=\s*type\s*[:=-]|$)/i)

  if (equipmentLabelMatch || typeLabelMatch) {
    const equipmentId = (equipmentLabelMatch?.[1] || '')
      .replace(/^[^a-z0-9]+|[^a-z0-9_-]+$/gi, '')
      .trim()
    const type = (typeLabelMatch?.[1] || '')
      .replace(/^[^a-z0-9]+|[^a-z0-9 _-]+$/gi, '')
      .trim()
    return { equipmentId, type }
  }

  // Fallback: treat the full QR as equipment id
  return { equipmentId: raw, type: '' }
}

export default function OperatorCheckin({ token, operatorId, apiBaseUrl }) {
  const [qrText, setQrText] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/operator/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipmentId: equipmentId.trim(),
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || `Check-in failed (${res.status})`)

      setSuccess(`Updated last operator for ${payload?.record?.equipment_id || equipmentId}. Ready for next scan.`)
      setEquipmentId('')
      setQrText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = equipmentId.trim().length > 0 && !submitting

  return (
    <div className="container">
      <div className="panel">
        <div className="topbar">
          <div>
            <div className="title">Operator Check-in</div>
            <div className="hint">Logged in as {operatorId}. Scan QR and mark equipment as in-use.</div>
          </div>
          <div className="badge">OPS</div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>1) Scan Equipment QR</div>

            {!equipmentId ? (
              <div style={{ border: '1px dashed var(--panelLine)', borderRadius: 12, padding: 12 }}>
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={(result) => {
                    const text = result?.getText?.()
                    if (!text) return
                    // Avoid re-processing the same scan repeatedly.
                    if (text === qrText) return
                    setQrText(text)
                    const parsed = parseQrText(text)
                    if (parsed.equipmentId) {
                      setEquipmentId(parsed.equipmentId)
                    }
                  }}
                  // The package exposes options by props; keep the component stable.
                  scanDelay={300}
                  containerStyle={{ width: '100%' }}
                />
                <div className="hint" style={{ marginTop: 10 }}>
                  QR should encode equipment id present in `rental_records` (example `EQX1001`).
                </div>
              </div>
            ) : (
              <div>
                <div className="hint">Scan captured.</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>{equipmentId}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setEquipmentId('')
                      setQrText('')
                      setSuccess('')
                      setError('')
                    }}
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
                  >
                    Scan Again
                  </button>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label>Equipment ID</label>
                  <input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} />
                </div>
              </div>
            )}
            <form onSubmit={submit}>
              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <div style={{ marginTop: 16 }}>
                <button type="submit" disabled={!canSubmit}>
                  {submitting ? 'Updating...' : 'Mark As In Use'}
                </button>
              </div>
            </form>
            <div className="hint">
              This updates only `operator_id` in existing `rental_records` rows. It does not create rental entries.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

