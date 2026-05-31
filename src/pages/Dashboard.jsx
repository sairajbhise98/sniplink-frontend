import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import CreateLinkModal from '../components/CreateLinkModal'
import { useAuth } from '../context/AuthContext'
import { getTotalLinks, getTotalClicks, getActiveLinks, getClickRate, getRecentLinks } from '../api/dashboard'
import { updateLink, deleteLink } from '../api/links'
import s from './Dashboard.module.css'

// ── Shared mini components ──────────────────────────────────────

function seededBars(id) {
  const bars = []
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  for (let i = 0; i < 7; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0
    bars.push(20 + ((h >>> 0) % 80))
  }
  return bars
}

function ClicksCell({ clickCount, id }) {
  const bars = seededBars(id)
  const max = Math.max(...bars)
  return (
    <div className={s.clicksCell}>
      <div className={s.miniBars}>
        {bars.map((h, i) => (
          <div key={i} className={`${s.miniBar} ${i === 6 ? s.miniBarLast : ''}`}
            style={{ height: `${Math.round((h / max) * 100)}%` }} />
        ))}
      </div>
      <span className={s.clickCount}>{clickCount.toLocaleString()}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    active:   { label: 'Active',   cls: s.badgeActive },
    expiring: { label: 'Expiring', cls: s.badgeExpiring },
    expired:  { label: 'Expired',  cls: s.badgeExpired },
    inactive: { label: 'Inactive', cls: s.badgeInactive },
  }
  const { label, cls } = map[status] ?? map.inactive
  return <span className={`${s.badge} ${cls}`}>{label}</span>
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button className={`${s.copyBtn} ${copied ? s.copyBtnCopied : ''}`} onClick={copy} title="Copy">
      {copied
        ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
      }
    </button>
  )
}

function Toggle({ active, onChange }) {
  return (
    <button className={`${s.toggle} ${active ? s.toggleOn : s.toggleOff}`} onClick={onChange}>
      <span className={s.toggleKnob} />
    </button>
  )
}

// ── Stat card ───────────────────────────────────────────────────

function StatCard({ loading, icon, iconCls, value, label, changeUp, changeLabel }) {
  return (
    <div className={s.statCard}>
      <div className={`${s.statIcon} ${iconCls}`}>{icon}</div>
      {loading
        ? <>
            <div className={`${s.shimmer} ${s.shimmerVal}`} />
            <div className={`${s.shimmer} ${s.shimmerLabel}`} />
            <div className={`${s.shimmer} ${s.shimmerBadge}`} />
          </>
        : <>
            <div className={s.statValue}>{value}</div>
            <div className={s.statLabel}>{label}</div>
            {changeLabel && (
              <div className={`${s.statChange} ${changeUp ? s.changeUp : s.changeDown}`}>
                {changeUp ? '▲' : '▼'} {changeLabel}
              </div>
            )}
          </>
      }
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [totalLinks,  setTotalLinks]  = useState(null)
  const [totalClicks, setTotalClicks] = useState(null)
  const [activeLinks, setActiveLinks] = useState(null)
  const [clickRate,   setClickRate]   = useState(null)
  const [recentLinks, setRecentLinks] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    // Load all 5 in parallel — each updates independently as it resolves
    getTotalLinks().then(r  => setTotalLinks(r.data)).catch(() => setTotalLinks('—'))
    getTotalClicks().then(r => setTotalClicks(r.data)).catch(() => setTotalClicks('—'))
    getActiveLinks().then(r => setActiveLinks(r.data)).catch(() => setActiveLinks('—'))
    getClickRate().then(r   => setClickRate(r.data)).catch(() => setClickRate('—'))
    getRecentLinks()
      .then(r  => setRecentLinks(r.data.items))
      .catch(() => setRecentLinks([]))
      .finally(() => setRecentLoading(false))
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleToggle(link) {
    try {
      const res = await updateLink(link.id, { is_active: !link.is_active })
      setRecentLinks(prev => prev.map(l => l.id === link.id ? res.data : l))
    } catch {
      showToast('Failed to update link.', 'error')
    }
  }

  async function handleDelete(link) {
    try {
      await deleteLink(link.id)
      setRecentLinks(prev => prev.filter(l => l.id !== link.id))
      showToast('Link deleted.')
    } catch {
      showToast('Failed to delete.', 'error')
    }
  }

  function shortDisplay(link) {
    try {
      const u = new URL(link.short_url)
      return `shrink.to${u.pathname}`
    } catch { return link.short_url }
  }

  const statCards = [
    {
      loading: totalLinks === null,
      icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
      iconCls: s.iconPurple,
      value: typeof totalLinks === 'object' ? totalLinks?.total?.toLocaleString() : totalLinks,
      label: 'Total Links',
      changeUp: true,
      changeLabel: typeof totalLinks === 'object' ? `${totalLinks?.this_week} this week` : null,
    },
    {
      loading: totalClicks === null,
      icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#06b6d4" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
      iconCls: s.iconCyan,
      value: typeof totalClicks === 'object' ? totalClicks?.total?.toLocaleString() : totalClicks,
      label: 'Total Clicks',
      changeUp: typeof totalClicks === 'object' ? (totalClicks?.growth_pct ?? 0) >= 0 : true,
      changeLabel: typeof totalClicks === 'object' ? `${totalClicks?.growth_pct}% this month` : null,
    },
    {
      loading: activeLinks === null,
      icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      iconCls: s.iconGreen,
      value: typeof activeLinks === 'object' ? activeLinks?.active?.toLocaleString() : activeLinks,
      label: 'Active Links',
      changeUp: false,
      changeLabel: typeof activeLinks === 'object' ? `${activeLinks?.inactive} inactive` : null,
    },
    {
      loading: clickRate === null,
      icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
      iconCls: s.iconYellow,
      value: typeof clickRate === 'object' ? `${clickRate?.avg_click_rate}%` : clickRate,
      label: 'Avg Click Rate',
      changeUp: typeof clickRate === 'object' ? (clickRate?.vs_last_month ?? 0) >= 0 : true,
      changeLabel: typeof clickRate === 'object' ? `${clickRate?.vs_last_month}% vs last month` : null,
    },
  ]

  return (
    <AppShell>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Dashboard</h1>
          <p className={s.pageSub}>Welcome back, {user?.name}! Here's your link overview.</p>
        </div>
        <button className={s.btnShorten} onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Shorten URL
        </button>
      </div>

      {/* Stat cards */}
      <div className={s.statsGrid}>
        {statCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* Recent Links */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <h2 className={s.cardTitle}>Recent Links</h2>
          <button className={s.btnViewAll} onClick={() => navigate('/links')}>View All</button>
        </div>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Link</th>
              <th>Short URL</th>
              <th>Clicks</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className={s.shimmer} style={{ height: 18, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : recentLinks.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={s.empty}>No links yet. Create your first short link!</div>
                </td>
              </tr>
            ) : recentLinks.map(link => (
              <tr key={link.id}>
                <td>
                  <div className={s.linkCell}>
                    <span className={s.linkName}>{link.name}</span>
                    <span className={s.linkOriginal}>{link.original_url}</span>
                  </div>
                </td>
                <td>
                  <div className={s.shortCell}>
                    <a className={s.shortUrl} href={link.short_url} target="_blank" rel="noreferrer">
                      {shortDisplay(link)}
                    </a>
                    <CopyButton text={link.short_url} />
                  </div>
                </td>
                <td><ClicksCell clickCount={link.click_count} id={link.id} /></td>
                <td><StatusBadge status={link.status} /></td>
                <td>
                  <div className={s.createdCell}>
                    <span>{new Date(link.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className={s.createdSub}>Created</span>
                  </div>
                </td>
                <td>
                  <div className={s.actions}>
                    <Toggle active={link.is_active} onChange={() => handleToggle(link)} />
                    <button className={s.deleteBtn} onClick={() => handleDelete(link)} title="Delete">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={link => {
          setRecentLinks(prev => [link, ...prev].slice(0, 5))
          showToast('Short link created!')
        }}
      />

      {toast && (
        <div className={`${s.toast} ${toast.type === 'error' ? s.toastError : s.toastSuccess}`}>
          {toast.type === 'error'
            ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
            : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </AppShell>
  )
}
