import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import s from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <AppShell>
      <div className={s.placeholder}>
        <div className={s.placeholderIcon}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h2 className={s.placeholderTitle}>Dashboard</h2>
        <p className={s.placeholderText}>
          Welcome back, <strong>{user?.name}</strong>!
          <br />
          Analytics and stats coming soon.
        </p>
      </div>
    </AppShell>
  )
}
