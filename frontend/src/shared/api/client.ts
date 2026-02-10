import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from './types'
import { getToken } from '@/shared/auth/token'

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<ApiResponse<T>>(config)
    if (!response.data.success) {
      throw new ApiError(response.data.message ?? 'Request failed', response.status)
    }
    return response.data.data
  } catch (error) {
    throw parseApiError(error)
  }
}

function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof AxiosError) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      'Network error'
    return new ApiError(message, error.response?.status)
  }

  return new ApiError('Unexpected error')
}
