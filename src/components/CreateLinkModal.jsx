import { useState, useEffect } from 'react'
import { createLink } from '../api/links'
import s from './CreateLinkModal.module.css'

export default function CreateLinkModal({ open, onClose, onCreated }) {
  const [url, setUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [expiry, setExpiry] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setUrl(''); setSlug(''); setExpiry(''); setError('')
    }
  }, [open])

  // close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://')
      return
    }

    const payload = { original_url: url }
    if (slug.trim()) payload.slug = slug.trim()
    if (expiry) payload.expires_at = new Date(expiry).toISOString()

    setLoading(true)
    try {
      const res = await createLink(payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Failed to create link.')
      } else {
        setError(detail || 'Failed to create link. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const previewSlug = slug.trim() || 'my-link'

  return (
    <div className={s.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={s.modal}>
        <div className={s.header}>
          <h2 className={s.title}>Shorten a URL</h2>
          <button className={s.closeBtn} onClick={onClose}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label className={s.label}>Destination URL</label>
            <input
              className={s.input}
              type="url"
              placeholder="https://example.com/very-long-url..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>
              Custom Slug <span className={s.optional}>(optional)</span>
            </label>
            <div className={s.slugRow}>
              <span className={s.slugPrefix}>shrink.to/</span>
              <input
                className={`${s.input} ${s.slugInput}`}
                type="text"
                placeholder="my-link"
                value={slug}
                onChange={e => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
              />
            </div>
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>
              Expiry Date <span className={s.optional}>(optional)</span>
            </label>
            <input
              className={s.input}
              type="date"
              value={expiry}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setExpiry(e.target.value)}
            />
          </div>

          {url && (
            <div className={s.preview}>
              <div className={s.previewLabel}>Preview</div>
              <div className={s.previewRow}>
                <span className={s.previewShort}>shrink.to/{previewSlug}</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className={s.previewDest}>{url}</span>
              </div>
            </div>
          )}

          {error && <div className={s.errorMsg}>{error}</div>}

          <div className={s.footer}>
            <button type="button" className={s.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={s.btnCreate} disabled={loading}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {loading ? 'Creating…' : 'Create Short Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
