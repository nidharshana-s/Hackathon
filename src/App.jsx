import Header from './components/Header.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import FleetGauge from './components/FleetGauge.jsx'
import HoursChart from './components/HoursChart.jsx'
import AssetTable from './components/AssetTable.jsx'
import { records, utilization } from './data.js'

function App() {
  const avgUtil = records.map(utilization).reduce((s, u) => s + u, 0) / records.length

  return (
    <div className="grain min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <SummaryCards records={records} utilization={utilization} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FleetGauge avgUtil={avgUtil} />
          <HoursChart records={records} />
        </section>

        <AssetTable records={records} />

        <footer className="text-center text-xs text-inkDim font-mono pb-4">
          Phase 1 dashboard · status &amp; utilization derived entirely from the source rental log · no external data assumed
        </footer>
      </main>
    </div>
  )
}

export default App
