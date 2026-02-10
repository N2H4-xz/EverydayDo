import { request } from '@/shared/api/client'
import type { CompletionSummaryResponse, HourlyCheckinResponse, PageResponse, SummaryPeriod } from '@/shared/api/types'

export function getCompletionSummary(period: SummaryPeriod, referenceDate?: string) {
  return request<CompletionSummaryResponse>({
    url: '/stats/completion',
    method: 'GET',
    params: {
      period,
      referenceDate,
    },
  })
}

export function getReviewPage(page = 1, size = 10, date?: string) {
  return request<PageResponse<HourlyCheckinResponse>>({
    url: '/stats/reviews',
    method: 'GET',
    params: {
      page,
      size,
      date,
    },
  })
}
