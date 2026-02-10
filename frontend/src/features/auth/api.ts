import { request } from '@/shared/api/client'
import type { AuthResponse, UserProfile } from '@/shared/api/types'

interface LoginPayload {
  account: string
  password: string
}

interface RegisterPayload {
  username: string
  email: string
  password: string
}

export function login(payload: LoginPayload) {
  return request<AuthResponse>({
    url: '/auth/login',
    method: 'POST',
    data: payload,
  })
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>({
    url: '/auth/register',
    method: 'POST',
    data: payload,
  })
}

export function me() {
  return request<UserProfile>({
    url: '/auth/me',
    method: 'GET',
  })
}
