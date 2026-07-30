import { useEffect, useMemo, useState } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function buildDueMap(records) {
  const map = new Map()

  for (const record of records) {
    const raw = record.checkOut ?? record.checkout
    if (!raw) continue

    const due = new Date(raw)
    if (Number.isNaN(due.getTime())) continue

    const key = dateKey(due)
    const list = map.get(key) ?? []
    list.push({
      id: record.id,
      type: record.type,
      overdue: record.overdue === true || record.overdue === 'true' || startOfDay(due) < startOfDay(new Date()),
    })
    map.set(key, list)
  }

  return map
}

function initialMonth(records) {
  const today = new Date()
  const dues = records
    .map((r) => r.checkOut ?? r.checkout)
    .filter(Boolean)
    .map((v) => new Date(v))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b)

  if (dues.length === 0) {
    return { year: today.getFullYear(), month: today.getMonth() }
  }

  const upcoming = dues.find((d) => startOfDay(d) >= startOfDay(today))
  const focus = upcoming ?? dues[dues.length - 1]
  return { year: focus.getFullYear(), month: focus.getMonth() }
}

export default function DueDateCalendar({ records }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (synced || records.length === 0) return
    const focus = initialMonth(records)
    setYear(focus.year)
    setMonth(focus.month)
    setSynced(true)
  }, [records, synced])

  const dueMap = useMemo(() => buildDueMap(records), [records])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startPad = first.getDay()
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7
    const todayKey = dateKey(new Date())
    const list = []

    for (let i = 0; i < total; i += 1) {
      const dayNum = i - startPad + 1
      if (dayNum < 1 || dayNum > daysInMonth) {
        list.push({ key: `pad-${i}`, empty: true })
        continue
      }

      const date = new Date(year, month, dayNum)
      const key = dateKey(date)
      list.push({
        key,
        empty: false,
        day: dayNum,
        isToday: key === todayKey,
        dues: dueMap.get(key) ?? [],
      })
    }

    return list
  }, [year, month, dueMap])

  const monthDueCount = useMemo(
    () => cells.reduce((sum, cell) => sum + (cell.dues?.length ?? 0), 0),
    [cells],
  )

  function shiftMonth(delta) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <section className="panel rounded-xl overflow-hidden h-full">
      <div className="px-4 sm:px-5 py-3 border-b border-panelLine flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-base text-ink">Return Calendar</h2>
          <p className="text-[10px] text-inkDim font-mono">
            {monthDueCount} due · EQ IDs by checkout date
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="h-7 w-7 rounded-md border border-panelLine bg-[#0F1317] text-ink hover:border-teal transition-colors font-mono text-sm"
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="font-display font-semibold text-ink min-w-[7.5rem] text-center text-xs">
            {monthLabel(year, month)}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="h-7 w-7 rounded-md border border-panelLine bg-[#0F1317] text-ink hover:border-teal transition-colors font-mono text-sm"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-[9px] font-mono text-inkDim py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell) => {
            if (cell.empty) {
              return <div key={cell.key} className="min-h-[3.25rem] rounded bg-[#12161A]/opacity-40" />
            }

            return (
              <div
                key={cell.key}
                className={`min-h-[3.25rem] rounded border p-1 flex flex-col gap-0.5 ${
                  cell.isToday
                    ? 'border-teal/50 bg-[rgba(47,211,184,0.06)]'
                    : 'border-panelLine bg-[#12161A]'
                }`}
              >
                <span
                  className={`text-[9px] font-mono leading-none ${
                    cell.isToday ? 'text-teal' : 'text-inkDim'
                  }`}
                >
                  {cell.day}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {cell.dues.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      title={`${item.id} · ${item.type}${item.overdue ? ' · overdue' : ''}`}
                      className={`font-mono text-[8px] px-0.5 py-px rounded truncate ${
                        item.overdue
                          ? 'bg-[rgba(226,97,47,0.15)] text-rust border border-[rgba(226,97,47,0.35)]'
                          : 'bg-[rgba(47,211,184,0.12)] text-teal border border-[rgba(47,211,184,0.3)]'
                      }`}
                    >
                      {item.id}
                    </span>
                  ))}
                  {cell.dues.length > 2 && (
                    <span className="font-mono text-[8px] text-inkDim px-0.5">
                      +{cell.dues.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] font-mono text-inkDim">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-sm bg-teal" /> upcoming
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-sm bg-rust" /> overdue
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-sm ring-1 ring-teal bg-[rgba(47,211,184,0.2)]" /> today
          </span>
        </div>
      </div>
    </section>
  )
}
