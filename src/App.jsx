import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AccountCreated from './pages/AccountCreated'
import LinksPage from './pages/LinksPage'
import ComingSoon from './pages/ComingSoon'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/links" replace /> : children
}

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute><LinksPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><ComingSoon title="Analytics" icon={<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>} /></ProtectedRoute>} />
          <Route path="/account-created" element={<ProtectedRoute><AccountCreated /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/links" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}
