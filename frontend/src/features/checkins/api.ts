import { request } from '@/shared/api/client'
import type { HourlyCheckinResponse, PendingWindowCheckinResponse } from '@/shared/api/types'

interface CheckinRecordRequest {
  taskInstanceId?: number
  title?: string
  completedMinutes: number
  comment?: string
  referenceLink?: string
}

interface SubmitHourlyCheckinPayload {
  windowStart: string
  windowEnd: string
  overallComment?: string
  records: CheckinRecordRequest[]
}

export function getPendingWindow(windowMinutes = 60) {
  return request<PendingWindowCheckinResponse>({
    url: '/checkins/hourly/pending',
    method: 'GET',
    params: { windowMinutes },
  })
}

export function getCheckinsByDate(date: string) {
  return request<HourlyCheckinResponse[]>({
    url: '/checkins/hourly',
    method: 'GET',
    params: { date },
  })
}

export function submitHourlyCheckin(payload: SubmitHourlyCheckinPayload) {
  return request<HourlyCheckinResponse>({
    url: '/checkins/hourly',
    method: 'POST',
    data: payload,
  })
}
