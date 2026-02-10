import { Navigate, createBrowserRouter } from 'react-router-dom'
import { hasToken } from '@/shared/auth/token'
import { AppLayout } from '@/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TodayPage } from '@/pages/TodayPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { CheckinsPage } from '@/pages/CheckinsPage'
import { StatsPage } from '@/pages/StatsPage'

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!hasToken()) {
    return <Navigate replace to="/login" />
  }
  return children
}

function RedirectIfAuthenticated({ children }: { children: JSX.Element }) {
  if (hasToken()) {
    return <Navigate replace to="/today" />
  }
  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: '/register',
    element: (
      <RedirectIfAuthenticated>
        <RegisterPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate replace to="/today" /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'checkins', element: <CheckinsPage /> },
      { path: 'stats', element: <StatsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/today" />,
  },
])
