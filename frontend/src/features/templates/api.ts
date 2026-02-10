import { request } from '@/shared/api/client'
import type { RecurrenceType, TaskTemplateResponse } from '@/shared/api/types'

interface CreateTemplatePayload {
  title: string
  description?: string
  estimatedMinutes: number
  priority: number
  recurrenceType: RecurrenceType
  dayOfWeek?: number
  specificDate?: string
  defaultStartTime?: string
  activeFrom?: string
  activeTo?: string
}

export function getTemplates() {
  return request<TaskTemplateResponse[]>({
    url: '/templates',
    method: 'GET',
  })
}

export function createTemplate(payload: CreateTemplatePayload) {
  return request<TaskTemplateResponse>({
    url: '/templates',
    method: 'POST',
    data: payload,
  })
}
