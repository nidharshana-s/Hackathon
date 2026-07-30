import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function HoursChart({ records }) {
  const topRecords = [...records]
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
    .slice(0, 10)

  const data = {
    labels: topRecords.map((r) => r.id),
    datasets: [
      {
        label: 'Engine Hrs/Day',
        data: topRecords.map((r) => r.engine),
        backgroundColor: '#2FD3B8',
        borderRadius: 4,
        maxBarThickness: 26,
      },
      {
        label: 'Idle Hrs/Day',
        data: topRecords.map((r) => r.idle),
        backgroundColor: '#E2612F',
        borderRadius: 4,
        maxBarThickness: 26,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: '#8B9AA6', font: { family: 'IBM Plex Mono', size: 11 } },
        grid: { color: '#2A333C' },
      },
      y: {
        ticks: { color: '#8B9AA6', font: { family: 'IBM Plex Mono', size: 11 } },
        grid: { color: '#2A333C' },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="panel rounded-xl p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-inkDim font-mono">ENGINE HRS/DAY vs IDLE HRS/DAY — PER UNIT</p>
        <div className="flex gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#2FD3B8' }} />
            Engine
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#E2612F' }} />
            Idle
          </span>
        </div>
      </div>
      <Bar data={data} options={options} height={140} />
    </div>
  )
}
