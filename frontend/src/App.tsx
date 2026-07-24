import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/app-layout'
import { useAuth } from '@/lib/auth-context'
import { LoginPage } from '@/pages/login-page'
import { GroupsPage } from '@/pages/groups-page'
import { GroupDetailPage } from '@/pages/group-detail-page'

function ProtectedLayout() {
  const { currentUser, isLoading } = useAuth()
  if (isLoading) return null
  if (!currentUser) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/groups" replace />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
