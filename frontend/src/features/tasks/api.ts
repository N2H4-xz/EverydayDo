import { request } from '@/shared/api/client'
import type { TaskInstanceResponse } from '@/shared/api/types'

interface CreateManualTaskPayload {
  title: string
  description?: string
  planDate: string
  plannedStartTime?: string
  plannedMinutes: number
}

export function getTasksByDate(date: string) {
  return request<TaskInstanceResponse[]>({
    url: '/tasks',
    method: 'GET',
    params: { date },
  })
}

export function createManualTask(payload: CreateManualTaskPayload) {
  return request<TaskInstanceResponse>({
    url: '/tasks/manual',
    method: 'POST',
    data: payload,
  })
}

export function generatePlanForDate(date: string) {
  return request<number>({
    url: '/plans/generate',
    method: 'POST',
    params: { date },
  })
}
