// Exact fields as provided in rental_tracking.csv — no invented columns.
export const records = [
  { id: 'EQX1001', type: 'Excavator', site: 'S003', checkIn: '2025-04-01', checkOut: '2025-04-16', engine: 1.5, idle: 10, days: 15, operator: 'OP101' },
  { id: 'EQX1002', type: 'Crane', site: null, checkIn: '2025-03-10', checkOut: '2025-03-30', engine: 0, idle: 11, days: 20, operator: null },
  { id: 'EQX1003', type: 'Bulldozer', site: 'S002', checkIn: '2025-02-15', checkOut: '2025-03-11', engine: 7.5, idle: 0.5, days: 25, operator: 'OP203' },
  { id: 'EQX1004', type: 'Excavator', site: 'S004', checkIn: '2025-05-05', checkOut: '2025-05-15', engine: 2, idle: 9, days: 10, operator: 'OP106' },
  { id: 'EQX1005', type: 'Bulldozer', site: 'S006', checkIn: '2025-01-01', checkOut: '2025-01-31', engine: 8, idle: 0, days: 30, operator: 'OP301' },
  { id: 'EQX1006', type: 'Grader', site: 'S001', checkIn: '2025-04-05', checkOut: '2025-04-23', engine: 3, idle: 6, days: 18, operator: 'OP114' },
  { id: 'EQX1007', type: 'Excavator', site: null, checkIn: '2025-03-20', checkOut: '2025-04-01', engine: 0, idle: 12, days: 12, operator: null },
]

// Utilization = share of logged runtime that was actual engine work vs idle.
export function utilization(r) {
  const total = r.engine + r.idle
  return total === 0 ? 0 : (r.engine / total) * 100
}

// Status is derived live from utilization — never stored, so it can't drift from the source data.
export function statusFor(u) {
  if (u >= 70) return { label: 'OPTIMAL', cls: 'badge-optimal' }
  if (u >= 30) return { label: 'BALANCED', cls: 'badge-balanced' }
  return { label: 'IDLE-HEAVY', cls: 'badge-idle' }
}

export function isUnassigned(r) {
  return !r.site || !r.operator
}
