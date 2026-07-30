// Utilization = share of logged runtime that was actual engine work vs idle.
export function utilization(r) {
  const total = r.engine + r.idle
  return total === 0 ? 0 : (r.engine / total) * 100
}

// Status is derived live from utilization — never stored, so it can't drift from source data.
export function statusFor(u) {
  if (u >= 70) return { label: 'OPTIMAL', cls: 'badge-optimal' }
  if (u >= 30) return { label: 'BALANCED', cls: 'badge-balanced' }
  return { label: 'IDLE-HEAVY', cls: 'badge-idle' }
}

export function isUnassigned(r) {
  return !r.site || !r.operator
}
