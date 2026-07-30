import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import FleetGauge from './components/FleetGauge.jsx'
import HoursChart from './components/HoursChart.jsx'
import AssetTable from './components/AssetTable.jsx'
import ForecastPanel from './components/ForecastPanel.jsx'
import { fleetEfficiency, utilization } from './utils/records.js'

function App() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadRecords() {
      try {
        const response = await fetch('http://localhost:4000/api/records')
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const payload = await response.json()
        if (!cancelled) {
          setRecords(payload.records ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load records')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRecords()
    return () => {
      cancelled = true
    }
  }, [])

  const avgUtil = useMemo(() => {
    if (records.length === 0) return 0
    return Number(fleetEfficiency(records))
  }, [records])

  return (
    <div className="grain min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loading && <p className="text-inkDim font-mono text-sm">Loading records from PostgreSQL...</p>}
        {error && <p className="text-rust font-mono text-sm">Failed to load records: {error}</p>}

        {!loading && !error && (
          <>
            <SummaryCards records={records} utilization={utilization} />

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FleetGauge avgUtil={avgUtil} />
              <HoursChart records={records} />
            </section>

            <ForecastPanel />
            <AssetTable records={records} />
          </>
        )}

        <footer className="text-center text-xs text-inkDim font-mono pb-4">
          Phase 1 dashboard · live status &amp; utilization derived from PostgreSQL records
        </footer>
      </main>
    </div>
  )
}

export default App
