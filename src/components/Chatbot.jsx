import { useEffect, useRef, useState } from 'react'

const starterMessage = {
  role: 'assistant',
  text: 'Ask about equipment, rentals, utilization, idle time, or demand forecasts.',
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([starterMessage])
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)
  const messagesRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function sendQuestion(event) {
    event.preventDefault()
    const text = question.trim()
    if (!text || sending) return

    setQuestion('')
    setMessages((current) => [...current, { role: 'user', text }])
    setSending(true)
    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to send your question.')
      setMessages((current) => [...current, { role: 'assistant', text: payload.answer }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', error: true, text: error.message }])
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="fixed bottom-5 left-5 z-40 font-body">
      {open && (
        <section className="panel mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/40" aria-label="Fleet assistant">
          <header className="flex items-center justify-between border-b border-panelLine px-4 py-3">
            <div>
              <h2 className="font-display font-semibold text-ink">Fleet Assistant</h2>
              <p className="font-mono text-[10px] text-teal">LIVE DASHBOARD CONTEXT</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-inkDim hover:bg-white/5 hover:text-ink" aria-label="Close chat">×</button>
          </header>
          <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.map((message, index) => (
              <div key={index} className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-amber text-[#12161a]' : message.error ? 'bg-rust/15 text-[#ffb199]' : 'bg-white/5 text-ink'}`}>
                {message.text}
              </div>
            ))}
            {sending && <div className="w-fit rounded-xl bg-white/5 px-3 py-2 font-mono text-xs text-inkDim">Checking fleet data…</div>}
          </div>
          <form onSubmit={sendQuestion} className="border-t border-panelLine p-3">
            <label className="sr-only" htmlFor="fleet-question">Ask the Fleet Assistant</label>
            <div className="flex gap-2">
              <input ref={inputRef} id="fleet-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength="500" placeholder="Ask about your fleet…" className="min-w-0 flex-1 rounded-lg border border-panelLine bg-graphite px-3 py-2 text-sm text-ink outline-none placeholder:text-inkDim focus:border-teal" />
              <button type="submit" disabled={sending || !question.trim()} className="rounded-lg bg-amber px-3 font-mono text-xs font-semibold text-[#12161a] transition hover:bg-[#ffc25d] disabled:cursor-not-allowed disabled:opacity-40">SEND</button>
            </div>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-14 w-14 items-center justify-center rounded-full border border-amber/60 bg-panel text-amber shadow-lg shadow-black/40 transition hover:scale-105 hover:bg-[#242d35]" aria-label={open ? 'Close chat' : 'Open Fleet Assistant'} aria-expanded={open}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8.5 8A8.7 8.7 0 0 1 8 18.7L4 20l1.3-3.6A8 8 0 1 1 20 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" strokeLinecap="round" /></svg>
      </button>
    </aside>
  )
}
