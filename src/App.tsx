import { useEffect, useMemo, useState } from 'react'
import { Clock, Globe, MagnifyingGlass, Plus, Ticket, User } from '@phosphor-icons/react'
import { t, type Lang } from './i18n'
import { agents, seedTickets, type Priority, type Status, type Ticket as TicketType } from './data'

const KEY = 'helpdesk-lang'
const STORE = 'helpdesk-tickets-v1'
const STATUSES: Status[] = ['open', 'inProgress', 'waiting', 'resolved']
const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(KEY) === 'ar' ? 'ar' : 'en'))
  const [tickets, setTickets] = useState<TicketType[]>(() => {
    try { const raw = localStorage.getItem(STORE); return raw ? JSON.parse(raw) as TicketType[] : seedTickets } catch { return seedTickets }
  })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Status>('all')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [agent, setAgent] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reply, setReply] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ subject: '', customer: '', email: '', priority: 'medium' as Priority, description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; localStorage.setItem(KEY, lang) }, [lang])
  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(tickets)) }, [tickets])
  const tr = (k: string) => t(lang, k)
  const filtered = useMemo(() => tickets.filter(x =>
    (status === 'all' || x.status === status) && (priority === 'all' || x.priority === priority) &&
    (agent === 'all' || x.agent === agent) && (query.trim() === '' || (x.subject + x.customer + x.id).toLowerCase().includes(query.toLowerCase()))), [tickets, status, priority, agent, query])
  const selected = tickets.find(x => x.id === selectedId) ?? null
  const counts = useMemo(() => Object.fromEntries(STATUSES.map(s => [s, tickets.filter(x => x.status === s).length])) as Record<Status, number>, [tickets])
  const submit = () => {
    const e: Record<string, string> = {}
    if (!form.subject.trim()) e.subject = tr('subjectReq')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = tr('emailReq')
    if (form.description.trim().length < 10) e.description = tr('descriptionReq')
    setErrors(e); if (Object.keys(e).length) return
    const nt: TicketType = { id: `T-${1043 + tickets.length}`, subject: form.subject.trim(), customer: form.customer.trim() || 'Guest', email: form.email.trim(), status: 'open', priority: form.priority, agent: agents[0], created: new Date().toISOString().slice(0, 10), description: form.description.trim(), messages: [{ id: 'm0', author: form.customer.trim() || 'Guest', role: 'customer', text: form.description.trim(), time: new Date().toISOString().slice(0, 16).replace('T', ' ') }] }
    setTickets([nt, ...tickets]); setShowForm(false); setForm({ subject: '', customer: '', email: '', priority: 'medium', description: '' }); setNotice(tr('created')); setSelectedId(nt.id)
  }
  const sendReply = () => {
    if (!selected || !reply.trim()) return
    setTickets(ts => ts.map(x => x.id === selected.id ? { ...x, messages: [...x.messages, { id: `m${Date.now()}`, author: x.agent, role: 'agent', text: reply.trim(), time: new Date().toISOString().slice(0, 16).replace('T', ' ') }] } : x))
    setReply(''); setNotice(tr('replySent'))
  }
  const change = (id: string, patch: Partial<TicketType>) => setTickets(ts => ts.map(x => x.id === id ? { ...x, ...patch } : x))
  const statusColor = (s: Status) => s === 'open' ? 'bg-[#FEF3C7] text-[#92400E]' : s === 'inProgress' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : s === 'waiting' ? 'bg-[#F3E8FF] text-[#7E22CE]' : 'bg-[#ECFDF5] text-[#0F766E]'
  const priColor = (p: Priority) => p === 'high' ? 'text-[#B91C1C]' : p === 'medium' ? 'text-[#92400E]' : 'text-[#555]'
  return (
    <div className="min-h-screen bg-white text-[#181818]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-white">Skip</a>
      <header className="sticky top-4 z-20 mx-auto max-w-6xl px-4">
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3e3e3] bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <span className="title-1 flex items-center gap-2 font-semibold"><Ticket size={22} className="text-[#0F766E]" />{tr('appName')}</span>
          <div className="flex items-center gap-2">
            <span className="caption-4 hidden rounded-full bg-[#ECFDF5] px-3 py-1 text-[#0F766E] sm:inline">{tr('demoBadge')}</span>
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="button-sm motion-hover flex items-center gap-2 rounded-full border border-[#e3e3e3] px-3 py-2 active:scale-[0.98]"><Globe size={16} />{tr('langSwitch')}</button>
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pb-16">
        <section className="pt-12 pb-8">
          <h1 className="heading-1 hero-gradient max-w-[680px]">{tr('heroTitle')}</h1>
          <p className="body-3 mt-4 max-w-[680px] text-[#555]">{tr('heroSub')}</p>
          <button onClick={() => setShowForm(v => !v)} className="button-md motion-hover mt-6 flex items-center gap-2 rounded-xl bg-[#0F766E] px-3 py-2 text-white active:scale-[0.98]"><Plus size={18} />{tr('newTicket')}</button>
          {notice && <p role="status" className="caption-2 mt-3 text-[#0F766E]">{notice}</p>}
        </section>
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label={tr('summary')}>
          <article className="rounded-2xl border border-[#e3e3e3] p-4"><p className="heading-5">{tickets.length}</p><p className="caption-2 mt-1 text-[#555]">{tr('totalTickets')}</p></article>
          {STATUSES.map(s => <article key={s} className="rounded-2xl border border-[#e3e3e3] p-4"><p className="heading-5">{counts[s]}</p><p className="caption-2 mt-1 text-[#555]">{tr(s)}</p></article>)}
        </section>
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 rounded-xl border border-[#e3e3e3] px-3 py-2"><MagnifyingGlass size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={tr('searchPh')} aria-label={tr('searchPh')} className="w-full bg-transparent text-sm outline-none" /></div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <select value={status} onChange={e => setStatus(e.target.value as 'all' | Status)} aria-label={tr('status')} className="button-sm rounded-xl border border-[#e3e3e3] px-2 py-2"><option value="all">{tr('allStatuses')}</option>{STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}</select>
              <select value={priority} onChange={e => setPriority(e.target.value as 'all' | Priority)} aria-label={tr('priority')} className="button-sm rounded-xl border border-[#e3e3e3] px-2 py-2"><option value="all">{tr('allPriorities')}</option>{PRIORITIES.map(p => <option key={p} value={p}>{tr(p)}</option>)}</select>
              <select value={agent} onChange={e => setAgent(e.target.value)} aria-label={tr('assign')} className="button-sm rounded-xl border border-[#e3e3e3] px-2 py-2"><option value="all">{tr('allAgents')}</option>{agents.map(a => <option key={a} value={a}>{a}</option>)}</select>
            </div>
            {filtered.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#e3e3e3] p-8 text-center"><p className="body-3">{tr('noTickets')}</p><button onClick={() => { setQuery(''); setStatus('all'); setPriority('all'); setAgent('all') }} className="button-sm mt-4 rounded-xl bg-[#181818] px-3 py-2 text-white">{tr('all')}</button></div>
            ) : (
              <ul className="mt-4 space-y-2">
                {filtered.map(x => (
                  <li key={x.id}><button onClick={() => setSelectedId(x.id)} aria-current={selectedId === x.id} className={`motion-hover w-full rounded-2xl border p-4 text-start active:scale-[0.98] ${selectedId === x.id ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-[#e3e3e3]'}`}>
                    <span className="flex justify-between gap-2"><span className="title-4 font-semibold">{x.subject}</span><span className="caption-5 shrink-0 text-[#777]">{x.id}</span></span>
                    <span className="mt-2 flex flex-wrap gap-2"><span className={`caption-4 rounded-full px-2 py-1 ${statusColor(x.status)}`}>{tr(x.status)}</span><span className={`caption-4 font-semibold ${priColor(x.priority)}`}>{tr(x.priority)}</span><span className="caption-5 text-[#777]">{x.customer}</span></span>
                  </button></li>
                ))}
              </ul>
            )}
          </div>
          <div className="lg:col-span-2">
            {showForm && (
              <section className="rounded-2xl border border-[#e3e3e3] p-4 sm:p-6" aria-label={tr('createTicket')}>
                <h2 className="heading-6">{tr('createTicket')}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="title-4">{tr('subject')}</span><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-2 w-full rounded-xl border border-[#e3e3e3] px-3 py-2 text-sm" />{errors.subject && <span className="caption-2 text-[#B91C1C]">{errors.subject}</span>}</label>
                  <label className="block"><span className="title-4">{tr('customer')}</span><input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} className="mt-2 w-full rounded-xl border border-[#e3e3e3] px-3 py-2 text-sm" /></label>
                  <label className="block"><span className="title-4">Email</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-[#e3e3e3] px-3 py-2 text-sm" dir="ltr" />{errors.email && <span className="caption-2 text-[#B91C1C]">{errors.email}</span>}</label>
                  <label className="block"><span className="title-4">{tr('priority')}</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })} className="mt-2 w-full rounded-xl border border-[#e3e3e3] px-3 py-2 text-sm">{PRIORITIES.map(p => <option key={p} value={p}>{tr(p)}</option>)}</select></label>
                  <label className="block sm:col-span-2"><span className="title-4">{tr('description')}</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-[#e3e3e3] px-3 py-2 text-sm" />{errors.description && <span className="caption-2 text-[#B91C1C]">{errors.description}</span>}</label>
                </div>
                <div className="mt-4 flex gap-2"><button onClick={submit} className="button-md rounded-xl bg-[#0F766E] px-3 py-2 text-white active:scale-[0.98]">{tr('createTicket')}</button><button onClick={() => setShowForm(false)} className="button-md rounded-xl border border-[#e3e3e3] px-3 py-2">{tr('cancel')}</button></div>
              </section>
            )}
            {selected ? (
              <article className="mt-4 rounded-2xl border border-[#e3e3e3] p-4 sm:p-6 lg:mt-0">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="heading-6">{selected.subject}</h2><span className="caption-5 text-[#777]">{selected.id} · {selected.created}</span></div>
                <p className="body-6 mt-2 flex items-center gap-2 text-[#555]"><User size={16} />{selected.customer} · {selected.email}</p>
                <p className="body-3 mt-4">{selected.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="flex items-center gap-2"><span className="caption-2">{tr('status')}</span><select value={selected.status} onChange={e => change(selected.id, { status: e.target.value as Status })} className="button-sm rounded-xl border border-[#e3e3e3] px-2 py-2">{STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}</select></label>
                  <label className="flex items-center gap-2"><span className="caption-2">{tr('priority')}</span><select value={selected.priority} onChange={e => change(selected.id, { priority: e.target.value as Priority })} className="button-sm rounded-xl border border-[#e3e3e3] px-2 py-2">{PRIORITIES.map(p => <option key={p} value={p}>{tr(p)}</option>)}</select></label>
                  <label className="flex items-center gap-2"><span className="caption-2">{tr('assign')}</span><select value={selected.agent} onChange={e => change(selected.id, { agent: e.target.value })} className="button-sm rounded-xl border border-[#e3e3e3] px-2 py-2">{agents.map(a => <option key={a} value={a}>{a}</option>)}</select></label>
                </div>
                <h3 className="title-2 mt-6 font-semibold">{tr('messages')}</h3>
                <ul className="mt-3 space-y-3">
                  {selected.messages.map(m => <li key={m.id} className={`rounded-xl p-3 ${m.role === 'agent' ? 'bg-[#ECFDF5]' : 'bg-[#f5f5f5]'}`}><p className="caption-4 font-semibold">{m.author} · <span className="text-[#777]">{m.time}</span></p><p className="body-6 mt-1">{m.text}</p></li>)}
                </ul>
                <div className="mt-4 flex gap-2"><input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendReply() }} placeholder={tr('messagePh')} aria-label={tr('messagePh')} className="flex-1 rounded-xl border border-[#e3e3e3] px-3 py-2 text-sm" /><button onClick={sendReply} disabled={!reply.trim()} className="button-md rounded-xl bg-[#0F766E] px-3 py-2 text-white disabled:opacity-40">{tr('reply')}</button></div>
                <p className="caption-2 mt-6 flex items-center gap-2 text-[#777]"><Clock size={14} />{tr('avgFirstResponse')}: 1.4h · {tr('avgResolution')}: 7.2h</p>
              </article>
            ) : !showForm && (
              <div className="rounded-2xl border border-dashed border-[#e3e3e3] p-8 text-center"><p className="body-3">{tr('noTickets')}</p></div>
            )}
          </div>
        </section>
        <section className="mt-16 rounded-2xl bg-[#181818] p-8 text-white"><p className="heading-3 max-w-[680px]">{tr('tagline')}</p></section>
      </main>
      <footer className="border-t border-[#e3e3e3] py-8"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4"><p className="caption-2 text-[#777]">{tr('footerNote')}</p><div className="flex gap-4"><a href="#" className="caption-2">{tr('privacy')}</a><a href="#" className="caption-2">{tr('terms')}</a></div></div></footer>
    </div>
  )
}
