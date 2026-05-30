import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AccountCreated from './pages/AccountCreated'
import LinksPage from './pages/LinksPage'

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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute><LinksPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/account-created" element={<ProtectedRoute><AccountCreated /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/links" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
