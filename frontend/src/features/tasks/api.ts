import { request } from '@/shared/api/client'
import type { TaskInstanceResponse, TaskStatus } from '@/shared/api/types'

interface CreateManualTaskPayload {
  title: string
  description?: string
  planDate: string
  plannedStartTime?: string
  plannedMinutes: number
}

interface UpdateTaskPayload {
  title: string
  description?: string
  planDate: string
  plannedStartTime?: string
  plannedMinutes: number
  status: TaskStatus
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

export function updateTask(taskId: number, payload: UpdateTaskPayload) {
  return request<TaskInstanceResponse>({
    url: `/tasks/${taskId}`,
    method: 'PUT',
    data: payload,
  })
}

export function setTaskStatus(taskId: number, status: TaskStatus) {
  return request<TaskInstanceResponse>({
    url: `/tasks/${taskId}/status`,
    method: 'PATCH',
    params: { status },
  })
}

export function deleteTask(taskId: number) {
  return request<boolean>({
    url: `/tasks/${taskId}`,
    method: 'DELETE',
  })
}
