import { useMemo, useState } from 'react'
import { calculatedStats, efficiency, isActiveRental, runtimeHours } from '../utils/records.js'

const SORT_OPTIONS = [
  { value: 'eqId', label: 'Equipment ID' },
  { value: 'checkin', label: 'Check-In' },
  { value: 'efficiency', label: 'Efficiency' },
  { value: 'runtime', label: 'Runtime Hours' },
  { value: 'rentalDays', label: 'Rental Days' },
]

function sortValue(record, sortBy) {
  switch (sortBy) {
    case 'checkin': {
      const t = new Date(record.checkIn ?? record.checkin ?? 0).getTime()
      return Number.isNaN(t) ? 0 : t
    }
    case 'efficiency':
      return Number(efficiency(record))
    case 'runtime':
      return Number(runtimeHours(record))
    case 'rentalDays':
      return Number(record.rentalDays ?? record.days ?? 0)
    default:
      return 0
  }
}

function compareRecords(a, b, sortBy) {
  if (sortBy === 'eqId') {
    return String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  }
  return sortValue(b, sortBy) - sortValue(a, sortBy)
}

export default function AssetTable({ records }) {
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('checkin')

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    const list = records.filter((r) =>
      [r.id, r.type, r.site, r.operator].some((value) =>
        String(value ?? '').toLowerCase().includes(q),
      ),
    )

    return [...list].sort((a, b) => compareRecords(a, b, sortBy))
  }, [records, filter, sortBy])

  return (
    <section className="panel rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-panelLine flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-lg text-ink">Asset Log</h2>
          <p className="text-xs text-inkDim font-mono">every rental cycle on record · read directly from source data</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="asset-sort">Sort by</label>
          <select
            id="asset-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0F1317] border border-panelLine rounded-md px-3 py-1.5 text-sm font-mono text-ink focus:outline-none focus:border-teal"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="search equipment ID…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#0F1317] border border-panelLine rounded-md px-3 py-1.5 text-sm font-mono placeholder:text-inkDim focus:outline-none focus:border-teal w-48 text-ink"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-inkDim font-mono text-xs border-b border-panelLine">
              <th className="px-6 py-3">Equipment ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Site ID</th>
              <th className="px-4 py-3">Check-In</th>
              <th className="px-4 py-3">Check-Out</th>
              <th className="px-4 py-3">Engine Hrs/Day</th>
              <th className="px-4 py-3">Idle Hrs/Day</th>
              <th className="px-4 py-3">Rental Days</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Efficiency / Idle</th>
              <th className="px-4 py-3">Runtime</th>
              <th className="px-4 py-3">Fuel</th>
              <th className="px-4 py-3">Idle Loss</th>
              <th className="px-4 py-3">Alerts</th>
              <th className="px-4 py-3">Fine</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const stats = calculatedStats(r, records)
              const u = Number.parseFloat(stats.utilization)
              const unassigned = stats.isUnassigned
              const unused = Number(r.engine) === 0
              const isLive = isActiveRental(r)
              const overdue = r.overdue === true || r.overdue === 'true'
              const barColor = u >= 70 ? '#2FD3B8' : u >= 30 ? '#F2A93B' : '#E2612F'

              return (
                <tr key={r.id} className="row-hover border-b border-panelLine last:border-0">
                  <td className="px-6 py-3.5 font-mono font-medium text-ink">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-teal shadow-[0_0_8px_rgba(47,211,184,0.8)]' : 'bg-rust shadow-[0_0_8px_rgba(226,97,47,0.65)]'}`}
                        title={isLive ? 'Live: today is after the check-in date' : 'Inactive: check-in date has not passed'}
                        aria-label={isLive ? 'Live equipment' : 'Inactive equipment'}
                      />
                      {r.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink">{r.type}</td>
                  <td className={`px-4 py-3.5 font-mono ${!r.site ? 'text-rust' : 'text-inkDim'}`}>{r.site ?? '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-inkDim">{r.checkIn ? new Date(r.checkIn).toLocaleString() : '—'}</td>
                  <td className={`px-4 py-3.5 font-mono ${!r.checkOut ? 'text-teal' : 'text-inkDim'}`}>
                    {r.checkOut ? new Date(r.checkOut).toLocaleString() : 'In use'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-ink">{r.engine.toFixed(1)}</td>
                  <td className="px-4 py-3.5 font-mono text-ink">{r.idle.toFixed(1)}</td>
                  <td className="px-4 py-3.5 font-mono text-ink">{r.days}</td>
                  <td className={`px-4 py-3.5 font-mono ${!r.operator ? 'text-rust' : 'text-inkDim'}`}>{r.operator ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 w-32">
                      <div className="util-track h-1.5 rounded-full w-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${u.toFixed(0)}%`, background: barColor }} />
                      </div>
                      <span className="font-mono text-xs text-inkDim">{stats.efficiency}</span>
                    </div>
                    <span className="font-mono text-xs text-inkDim">idle {stats.idlePercentage}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-ink whitespace-nowrap">{stats.runtimeHours.toFixed(1)} h</td>
                  <td className="px-4 py-3.5 font-mono text-ink whitespace-nowrap">
                    <span>{stats.fuelPerDay.toFixed(1)} L/d</span>
                    <span className="block text-xs text-inkDim">{stats.totalFuel.toFixed(1)} L total</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-rust whitespace-nowrap">{stats.idleFuelLoss.toFixed(1)} L</td>
                  <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                    {stats.locationAlert !== 'OK' ? (
                      <span className="text-rust">LOCATION</span>
                    ) : stats.reminderNeeded ? (
                      <span className="text-amber">RETURN SOON</span>
                    ) : (
                      <span className="text-inkDim">CLEAR</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono whitespace-nowrap text-ink">₹{stats.fine.toLocaleString()}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`badge ${stats.statusClass} text-xs px-2 py-0.5 rounded`}>{stats.statusLabel}</span>
                      {overdue && <span className="badge badge-bad text-xs px-2 py-0.5 rounded">OVERDUE</span>}
                      {unused && <span className="badge badge-unused text-xs px-2 py-0.5 rounded">Under-Utilized</span>}
                      {unassigned && <span className="badge badge-warn text-xs px-2 py-0.5 rounded">UNASSIGNED</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
