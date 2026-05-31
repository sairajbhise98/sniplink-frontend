import AppShell from '../components/AppShell'
import s from './ComingSoon.module.css'

export default function ComingSoon({ title, icon }) {
  return (
    <AppShell>
      <div className={s.wrap}>
        <div className={s.iconWrap}>{icon}</div>
        <h1 className={s.title}>{title}</h1>
        <p className={s.text}>This page is under construction. Check back soon.</p>
        <div className={s.badge}>Coming Soon</div>
      </div>
    </AppShell>
  )
}
