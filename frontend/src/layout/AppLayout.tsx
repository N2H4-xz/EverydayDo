import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clearToken } from '@/shared/auth/token'
import { me } from '@/features/auth/api'

const navItems = [
  { to: '/today', label: '今日任务' },
  { to: '/templates', label: '周期任务' },
  { to: '/checkins', label: '小时打卡' },
  { to: '/stats', label: '统计' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
    retry: false,
  })

  useEffect(() => {
    if (meQuery.isError) {
      clearToken()
      queryClient.clear()
      navigate('/login', { replace: true })
    }
  }, [meQuery.isError, navigate, queryClient])

  const handleLogout = () => {
    clearToken()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  if (meQuery.isLoading) {
    return <div className="p-8 text-center text-slate-700">正在加载用户信息...</div>
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-4 md:p-6">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur md:flex md:items-center md:justify-between">
        <div>
          <Link className="text-2xl font-semibold tracking-tight text-slate-900" to="/today">
            EverydayDo
          </Link>
          <p className="text-sm text-slate-500">{meQuery.data?.username}</p>
        </div>
        <nav className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            onClick={handleLogout}
            type="button"
          >
            退出
          </button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
