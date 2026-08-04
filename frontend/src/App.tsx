import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/app-layout'
import { useAuth } from '@/lib/auth-context'
import { PageLoader } from '@/components/page-loader'

const LoginPage = lazy(() => import('@/pages/login-page').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() =>
  import('@/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })),
)
const GroupsPage = lazy(() => import('@/pages/groups-page').then((m) => ({ default: m.GroupsPage })))
const GroupDetailPage = lazy(() =>
  import('@/pages/group-detail-page').then((m) => ({ default: m.GroupDetailPage })),
)

function ProtectedLayout() {
  const { currentUser, isLoading } = useAuth()
  if (isLoading) return null
  if (!currentUser) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
