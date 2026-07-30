import { useEffect, useState } from 'react'
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

function formatTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export default function OperatorCheckin({ token, operatorId, apiBaseUrl }) {
  const [qrText, setQrText] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [checkedIn, setCheckedIn] = useState(false)
  const [record, setRecord] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function resetScan() {
    setEquipmentId('')
    setQrText('')
    setSiteId('')
    setCheckedIn(false)
    setRecord(null)
    setSuccess('')
    setError('')
  }

  useEffect(() => {
    if (!equipmentId || !token) return

    let cancelled = false

    async function loadStatus() {
      setLoadingStatus(true)
      setError('')
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/operator/equipment/${encodeURIComponent(equipmentId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || `Failed to load equipment (${res.status})`)
        if (cancelled) return

        setRecord(payload.record || null)
        setCheckedIn(Boolean(payload.checkedIn))
        if (payload.record?.site_id) {
          setSiteId(String(payload.record.site_id))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load equipment')
          setRecord(null)
          setCheckedIn(false)
        }
      } finally {
        if (!cancelled) setLoadingStatus(false)
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [equipmentId, token, apiBaseUrl])

  async function submitAction(action) {
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      if (!siteId.trim()) {
        throw new Error('Site ID is required')
      }

      const endpoint = action === 'checkin' ? 'checkin' : 'checkout'
      const res = await fetch(`${apiBaseUrl}/api/operator/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipmentId: equipmentId.trim(),
          siteId: siteId.trim(),
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || `${action} failed (${res.status})`)

      setRecord(payload.record || null)
      setCheckedIn(Boolean(payload.checkedIn))

      if (action === 'checkin') {
        setSuccess(
          `Checked in ${payload?.record?.equipment_id || equipmentId} at site ${siteId.trim()}. Check-in is now locked until checkout.`
        )
      } else {
        setSuccess(
          `Checked out ${payload?.record?.equipment_id || equipmentId}. You can check in again.`
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`)
    } finally {
      setSubmitting(false)
    }
  }

  const canAct = equipmentId.trim().length > 0 && siteId.trim().length > 0 && !submitting && !loadingStatus

  return (
    <div className="container">
      <div className="panel">
        <div className="topbar">
          <div>
            <div className="title">Operator Check-in / Check-out</div>
            <div className="hint">
              Logged in as {operatorId}. Scan equipment QR, enter site ID, then check in or check out.
            </div>
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
                      setSuccess('')
                      setError('')
                    }
                  }}
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
                    onClick={resetScan}
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
                  >
                    Scan Again
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label>Equipment ID</label>
                  <input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label>Site ID</label>
                  <input
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="e.g. S003"
                  />
                </div>

                <div style={{ marginTop: 12 }} className="hint">
                  {loadingStatus
                    ? 'Loading equipment status...'
                    : checkedIn
                      ? 'Status: CHECKED IN — Check-in disabled until you check out.'
                      : 'Status: AVAILABLE — Ready to check in.'}
                </div>

                {record && (
                  <div className="hint" style={{ marginTop: 8 }}>
                    Last check-in: {formatTimestamp(record.check_in)} · Last check-out:{' '}
                    {formatTimestamp(record.check_out)} · Operator: {record.operator_id || '—'}
                  </div>
                )}

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={!canAct || checkedIn}
                    onClick={() => submitAction('checkin')}
                    title={checkedIn ? 'Already checked in. Check out first.' : 'Record check-in time'}
                  >
                    {submitting ? 'Updating...' : 'Check-in'}
                  </button>

                  <button
                    type="button"
                    disabled={!canAct || !checkedIn}
                    onClick={() => submitAction('checkout')}
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}
                    title={!checkedIn ? 'Not checked in yet.' : 'Record check-out time'}
                  >
                    {submitting ? 'Updating...' : 'Check-out'}
                  </button>
                </div>

                <div className="hint" style={{ marginTop: 12 }}>
                  Check-in sets `site_id`, `check_in` (current time), and `operator_id`. Check-out sets
                  `check_out` (current time). After one check-in, Check-in stays disabled until checkout.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
