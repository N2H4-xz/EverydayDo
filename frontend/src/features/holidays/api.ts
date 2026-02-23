import { request } from '@/shared/api/client'
import type { HolidayDayResponse } from '@/shared/api/types'

interface UpsertHolidayPayload {
  holidayDate: string
  isHoliday: boolean
  name?: string
}

export function getHolidays(from: string, to: string) {
  return request<HolidayDayResponse[]>({
    url: '/holidays',
    method: 'GET',
    params: { from, to },
  })
}

export function upsertHoliday(payload: UpsertHolidayPayload) {
  return request<HolidayDayResponse>({
    url: '/holidays',
    method: 'POST',
    data: payload,
  })
}

export function deleteHoliday(holidayDate: string) {
  return request<boolean>({
    url: '/holidays',
    method: 'DELETE',
    params: { holidayDate },
  })
}
