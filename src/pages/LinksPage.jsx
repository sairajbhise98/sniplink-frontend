import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import CreateLinkModal from '../components/CreateLinkModal'
import { getLinks, updateLink, deleteLink } from '../api/links'
import s from './LinksPage.module.css'

function StatusBadge({ status }) {
  const map = {
    active:   { label: 'Active',        cls: s.badgeActive },
    expiring: { label: 'Expiring',      cls: s.badgeExpiring },
    expired:  { label: 'Expired',       cls: s.badgeExpired },
    inactive: { label: 'Inactive',      cls: s.badgeInactive },
  }
  const { label, cls } = map[status] ?? map.inactive
  return <span className={`${s.badge} ${cls}`}>{label}</span>
}

function Toggle({ active, onChange }) {
  return (
    <button className={`${s.toggle} ${active ? s.toggleOn : s.toggleOff}`} onClick={onChange} title={active ? 'Deactivate' : 'Activate'}>
      <span className={s.toggleKnob} />
    </button>
  )
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
          <div
            key={i}
            className={`${s.miniBar} ${i === 6 ? s.miniBarLast : ''}`}
            style={{ height: `${Math.round((h / max) * 100)}%` }}
          />
        ))}
      </div>
      <span className={s.clickCount}>{clickCount.toLocaleString()}</span>
    </div>
  )
}

const FILTER_MAP = {
  all: undefined,
  active: 'active',
  inactive: 'inactive',
  expiring_soon: 'expiring_soon',
}

export default function LinksPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [links, setLinks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // open modal if ?create=1 in URL (from header button)
  useEffect(() => {
    if (new URLSearchParams(location.search).get('create') === '1') {
      setModalOpen(true)
      navigate('/links', { replace: true })
    }
  }, [location.search, navigate])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (FILTER_MAP[filter]) params.status = FILTER_MAP[filter]
      if (search.trim()) params.search = search.trim()
      const res = await getLinks(params)
      setLinks(res.data.items)
      setTotal(res.data.total)
    } catch {
      showToast('Failed to load links.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(fetchLinks, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchLinks, search])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleToggle(link) {
    try {
      const res = await updateLink(link.id, { is_active: !link.is_active })
      setLinks(prev => prev.map(l => l.id === link.id ? res.data : l))
    } catch {
      showToast('Failed to update link.', 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteLink(deleteTarget.id)
      setLinks(prev => prev.filter(l => l.id !== deleteTarget.id))
      setTotal(t => t - 1)
      showToast('Link deleted.')
      setDeleteTarget(null)
    } catch {
      showToast('Failed to delete link.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleCreated(link) {
    setLinks(prev => [link, ...prev])
    setTotal(t => t + 1)
    showToast('Short link created!')
  }

  function formatExpiry(link) {
    if (!link.expires_at) return { date: 'Never', sub: null }
    const date = new Date(link.expires_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    const sub = link.days_left === null ? null :
      link.days_left <= 0 ? 'Expired' :
      `${link.days_left} day${link.days_left !== 1 ? 's' : ''} left`
    return { date, sub }
  }

  // Extract display slug from short_url
  function shortDisplay(link) {
    try {
      const u = new URL(link.short_url)
      return `shrink.to${u.pathname}`
    } catch {
      return link.short_url
    }
  }

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'expiring_soon', label: 'Expiring Soon' },
  ]

  return (
    <AppShell>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>My Links</h1>
          <p className={s.pageSub}>{total} link{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className={s.btnShorten} onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Shorten URL
        </button>
      </div>

      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            className={s.searchInput}
            placeholder="Search links..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={s.filters}>
          {filters.map(f => (
            <button
              key={f.key}
              className={`${s.chip} ${filter === f.key ? s.chipActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.card}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Link</th>
              <th>Short URL</th>
              <th>Clicks</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className={s.shimmer} style={{ height: 18, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={s.empty}>
                    <div className={s.emptyIcon}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className={s.emptyTitle}>No links found</div>
                    <div className={s.emptyText}>
                      {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first short link to get started.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : links.map(link => {
              const { date, sub } = formatExpiry(link)
              return (
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
                    <div className={s.expiryCell}>
                      <span>{date}</span>
                      {sub && <span className={s.expirySub}>{sub}</span>}
                    </div>
                  </td>
                  <td>
                    <div className={s.actions}>
                      <Toggle active={link.is_active} onChange={() => handleToggle(link)} />
                      <button
                        className={s.deleteBtn}
                        onClick={() => setDeleteTarget({ id: link.id, name: link.name })}
                        title="Delete"
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <CreateLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className={s.deleteModal}>
            <div className={s.deleteHeader}>
              <h3 className={s.deleteTitle}>Delete Link</h3>
              <button className={s.closeBtn} onClick={() => setDeleteTarget(null)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className={s.deleteBody}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <p className={s.deleteNote}>This action cannot be undone.</p>
            <div className={s.deleteFooter}>
              <button className={s.btnCancel} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={s.btnDelete} onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Delete Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${s.toast} ${toast.type === 'error' ? s.toastError : s.toastSuccess}`}>
          {toast.type === 'error'
            ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
            : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          }
          {toast.msg}
        </div>
      )}
    </AppShell>
  )
}
