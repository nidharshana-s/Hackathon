import { useState } from 'react'
import { utilization, statusFor, isUnassigned } from '../utils/records.js'

export default function AssetTable({ records }) {
  const [filter, setFilter] = useState('')

  const filtered = records.filter((r) => r.id.toLowerCase().includes(filter.toLowerCase()))

  return (
    <section className="panel rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-panelLine flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-lg text-ink">Asset Log</h2>
          <p className="text-xs text-inkDim font-mono">every rental cycle on record · read directly from source data</p>
        </div>
        <input
          type="text"
          placeholder="search equipment ID…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0F1317] border border-panelLine rounded-md px-3 py-1.5 text-sm font-mono placeholder:text-inkDim focus:outline-none focus:border-teal w-48 text-ink"
        />
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
              <th className="px-4 py-3">Utilization</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const u = utilization(r)
              const st = statusFor(u)
              const unassigned = isUnassigned(r)
              const barColor = u >= 70 ? '#2FD3B8' : u >= 30 ? '#F2A93B' : '#E2612F'

              return (
                <tr key={r.id} className="row-hover border-b border-panelLine last:border-0">
                  <td className="px-6 py-3.5 font-mono font-medium text-ink">{r.id}</td>
                  <td className="px-4 py-3.5 text-ink">{r.type}</td>
                  <td className={`px-4 py-3.5 font-mono ${!r.site ? 'text-rust' : 'text-inkDim'}`}>{r.site ?? '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-inkDim">{r.checkIn}</td>
                  <td className="px-4 py-3.5 font-mono text-inkDim">{r.checkOut}</td>
                  <td className="px-4 py-3.5 font-mono text-ink">{r.engine.toFixed(1)}</td>
                  <td className="px-4 py-3.5 font-mono text-ink">{r.idle.toFixed(1)}</td>
                  <td className="px-4 py-3.5 font-mono text-ink">{r.days}</td>
                  <td className={`px-4 py-3.5 font-mono ${!r.operator ? 'text-rust' : 'text-inkDim'}`}>{r.operator ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 w-32">
                      <div className="util-track h-1.5 rounded-full w-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${u.toFixed(0)}%`, background: barColor }} />
                      </div>
                      <span className="font-mono text-xs text-inkDim">{u.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`badge ${st.cls} text-xs px-2 py-0.5 rounded`}>{st.label}</span>
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
