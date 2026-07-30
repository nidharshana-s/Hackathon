import { useEffect, useState } from 'react'

export default function Header() {
  const [syncTime, setSyncTime] = useState('')

  useEffect(() => {
    setSyncTime(new Date().toLocaleString())
  }, [])

  return (
    <header className="border-b border-panelLine sticky top-0 z-20 backdrop-blur bg-[#12161Aee]">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md hazard-edge shrink-0" />
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-ink">CATegory 1</h1>
            <p className="text-xs text-inkDim font-mono -mt-0.5">FLEET RENTAL TRACKER</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-mono text-teal">{syncTime}</p>
        </div>
      </div>
    </header>
  )
}
