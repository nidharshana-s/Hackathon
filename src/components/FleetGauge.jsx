import { useEffect, useState } from 'react'

const CIRCUMFERENCE = 283

export default function FleetGauge({ avgUtil }) {
  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    const target = Math.min(Math.max(avgUtil, 0), 100)
    const raf = requestAnimationFrame(() => setAnimatedPct(target))
    return () => cancelAnimationFrame(raf)
  }, [avgUtil])

  const offset = CIRCUMFERENCE - (animatedPct / 100) * CIRCUMFERENCE
  const angle = -90 + (animatedPct / 100) * 180

  return (
    <div className="panel rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 100%, rgba(242,169,59,0.15), transparent 60%)' }}
      />
      <p className="text-xs text-inkDim font-mono mb-2 relative z-10">FLEET UTILIZATION GAUGE</p>

      <svg viewBox="0 0 220 130" className="w-56 gauge-glow relative z-10">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2612F" />
            <stop offset="50%" stopColor="#F2A93B" />
            <stop offset="100%" stopColor="#2FD3B8" />
          </linearGradient>
        </defs>
        <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#2A333C" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
        />
        <g style={{ transformOrigin: '110px 110px', transform: `rotate(${angle}deg)`, transition: 'transform 900ms ease-out' }}>
          <line x1="110" y1="110" x2="110" y2="35" stroke="#E7EDF2" strokeWidth="3" strokeLinecap="round" />
          <circle cx="110" cy="110" r="7" fill="#E7EDF2" />
        </g>
      </svg>

      <p className="font-display font-bold text-4xl -mt-2 relative z-10 text-ink">{animatedPct.toFixed(1)}%</p>
      <p className="text-xs text-inkDim font-mono relative z-10">avg. engine-hour share of runtime</p>
    </div>
  )
}
