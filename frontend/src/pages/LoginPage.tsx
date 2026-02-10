import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import { setToken } from '@/shared/auth/token'
import { login } from '@/features/auth/api'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setToken(response.token)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/today', { replace: true })
    },
    onError: (error) => {
      const apiError = error as ApiError
      setErrorMessage(apiError.message)
    },
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">欢迎回来</h1>
        <p className="mt-1 text-sm text-slate-600">登录后进入你的今日任务面板</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            setErrorMessage(null)
            loginMutation.mutate({ account, password })
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            账号（用户名或邮箱）
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setAccount(event.target.value)}
              required
              value={account}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            密码
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <button
            className="w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          还没有账号？
          <Link className="ml-1 font-semibold text-teal-700 hover:text-teal-600" to="/register">
            去注册
          </Link>
        </p>
      </div>
    </div>
  )
}
