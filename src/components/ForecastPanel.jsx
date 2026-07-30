import { useEffect, useState } from 'react'

const formatWeek = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
})

export default function ForecastPanel() {
  const [forecasts, setForecasts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:4000/api/forecasts')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load forecasts')
        return response.json()
      })
      .then((payload) => setForecasts(payload.forecasts ?? []))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section className="panel rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-panelLine">
        <h2 className="font-display font-semibold text-lg text-ink">Demand Forecast</h2>
        <p className="text-xs text-inkDim font-mono">weekly site-level equipment demand and pre-positioning recommendations</p>
      </div>

      {error && <p className="px-6 py-4 text-sm font-mono text-rust">{error}</p>}
      {!error && forecasts.length === 0 && (
        <p className="px-6 py-4 text-sm font-mono text-inkDim">No forecasts yet. Run the Python forecast service after loading demand history.</p>
      )}
      {forecasts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-inkDim font-mono text-xs border-b border-panelLine">
                <th className="px-6 py-3">Week</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Predicted Demand</th>
                <th className="px-4 py-3">Range</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((forecast) => (
                <tr key={`${forecast.siteId}-${forecast.equipmentType}-${forecast.forecastWeek}`} className="row-hover border-b border-panelLine last:border-0">
                  <td className="px-6 py-3 font-mono text-inkDim">{formatWeek(forecast.forecastWeek)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{forecast.siteId}</td>
                  <td className="px-4 py-3 text-ink">{forecast.equipmentType}</td>
                  <td className="px-4 py-3 font-mono text-teal">{forecast.predictedUnits.toFixed(1)} units</td>
                  <td className="px-4 py-3 font-mono text-inkDim">{forecast.lowerBound.toFixed(1)}–{forecast.upperBound.toFixed(1)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{forecast.availableUnits}</td>
                  <td className="px-6 py-3">
                    {forecast.prePositionUnits > 0 ? (
                      <span className="badge badge-warn text-xs px-2 py-0.5 rounded">MOVE {forecast.prePositionUnits} UNIT{forecast.prePositionUnits > 1 ? 'S' : ''}</span>
                    ) : (
                      <span className="badge badge-ok text-xs px-2 py-0.5 rounded">COVERED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
