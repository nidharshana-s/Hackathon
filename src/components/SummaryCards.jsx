export default function SummaryCards({ records, utilization }) {
  const total = records.length
  const totalDays = records.reduce((s, r) => s + r.days, 0)
  const utils = records.map(utilization)
  const avgUtil = utils.reduce((s, u) => s + u, 0) / total
  const idleHeavy = utils.filter((u) => u < 30).length
  const unassigned = records.filter((r) => !r.site || !r.operator).length

  const cards = [
    { label: 'TOTAL UNITS', value: total, color: 'text-ink' },
    { label: 'TOTAL RENTAL DAYS', value: totalDays, color: 'text-ink' },
    { label: 'AVG UTILIZATION', value: `${avgUtil.toFixed(1)}%`, color: 'text-teal' },
    { label: 'IDLE-HEAVY UNITS', value: idleHeavy, color: 'text-rust' },
    { label: 'UNASSIGNED RECORDS', value: unassigned, color: 'text-amber' },
  ]

  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="panel rounded-xl p-4">
          <p className="text-xs text-inkDim font-mono">{c.label}</p>
          <p className={`font-display font-bold text-3xl mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </section>
  )
}
