import { request } from '@/shared/api/client'
import type { RecurrenceType, TaskTemplateResponse, UpdateTaskTemplatePayload } from '@/shared/api/types'

interface CreateTemplatePayload {
  title: string
  description?: string
  estimatedMinutes: number
  priority: number
  recurrenceType: RecurrenceType
  dayOfWeek?: number
  specificDate?: string
  intervalDays?: number
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

export function updateTemplate(templateId: number, payload: UpdateTaskTemplatePayload) {
  return request<TaskTemplateResponse>({
    url: `/templates/${templateId}`,
    method: 'PUT',
    data: payload,
  })
}

export function setTemplateEnabled(templateId: number, enabled: boolean) {
  return request<TaskTemplateResponse>({
    url: `/templates/${templateId}/enabled`,
    method: 'PATCH',
    params: { enabled },
  })
}

export function deleteTemplate(templateId: number) {
  return request<boolean>({
    url: `/templates/${templateId}`,
    method: 'DELETE',
  })
}
