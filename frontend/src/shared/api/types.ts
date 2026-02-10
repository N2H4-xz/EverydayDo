export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface UserProfile {
  id: number
  username: string
  email: string
}

export interface AuthResponse {
  token: string
  profile: UserProfile
}

export type RecurrenceType =
  | 'DAILY'
  | 'WORKDAY'
  | 'HOLIDAY'
  | 'WEEKLY'
  | 'SPECIFIC_DATE'

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type SummaryPeriod = 'WEEK' | 'MONTH' | 'YEAR'

export interface TaskInstanceResponse {
  id: number
  templateId: number | null
  title: string
  description: string | null
  planDate: string
  plannedStartTime: string | null
  plannedMinutes: number
  completedMinutes: number
  status: TaskStatus
  adHoc: boolean
}

export interface TaskTemplateResponse {
  id: number
  title: string
  description: string | null
  estimatedMinutes: number
  priority: number
  recurrenceType: RecurrenceType
  dayOfWeek: number | null
  specificDate: string | null
  defaultStartTime: string | null
  activeFrom: string | null
  activeTo: string | null
  enabled: boolean
}

export interface HourlyCheckinResponse {
  checkinId: number
  windowStart: string
  windowEnd: string
  overallComment: string | null
  records: CheckinRecordResponse[]
}

export interface CheckinRecordResponse {
  taskInstanceId: number | null
  addedMinutes: number
  comment: string | null
  referenceLink: string | null
  createdAsAdHoc: boolean
}

export interface PendingWindowCheckinResponse {
  windowStart: string
  windowEnd: string
  windowMinutes: number
  submitted: boolean
  prompt: string
  plannedTasks: TaskInstanceResponse[]
}

export interface CompletionSummaryResponse {
  period: SummaryPeriod
  startDate: string
  endDate: string
  totalTasks: number
  completedTasks: number
  adHocTasks: number
  plannedMinutes: number
  completedMinutes: number
  taskCompletionRate: number
  minuteCompletionRate: number
}
