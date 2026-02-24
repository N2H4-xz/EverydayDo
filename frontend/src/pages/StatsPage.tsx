import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCompletionSummary, getReviewPage } from '@/features/stats/api'
import type { SummaryPeriod } from '@/shared/api/types'
import { toLocalDateTimeInput, todayDate } from '@/shared/lib/date'

const periods: SummaryPeriod[] = ['WEEK', 'MONTH', 'YEAR']

function normalizeReferenceLink(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function StatsPage() {
  const [period, setPeriod] = useState<SummaryPeriod>('WEEK')
  const [referenceDate, setReferenceDate] = useState(todayDate())
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewDate, setReviewDate] = useState('')

  const summaryQuery = useQuery({
    queryKey: ['stats', period, referenceDate],
    queryFn: () => getCompletionSummary(period, referenceDate),
  })

  const reviewsQuery = useQuery({
    queryKey: ['stats', 'reviews', reviewPage, reviewDate],
    queryFn: () => getReviewPage(reviewPage, 10, reviewDate || undefined),
  })

  return (
    <section className="space-y-6 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-2 lg:gap-6 lg:space-y-0 lg:overflow-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <h2 className="text-xl font-semibold text-slate-900">完成率统计</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            统计周期
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setPeriod(event.target.value as SummaryPeriod)}
              value={period}
            >
              {periods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            参考日期
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setReferenceDate(event.target.value)}
              type="date"
              value={referenceDate}
            />
          </label>
        </div>

        {summaryQuery.isLoading ? <p className="mt-4 text-slate-600">计算中...</p> : null}

        {summaryQuery.data ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 p-4 md:col-span-2 lg:col-span-3">
              <p className="text-sm text-slate-500">统计范围</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {summaryQuery.data.startDate} ~ {summaryQuery.data.endDate}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">任务完成率</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.taskCompletionRate.toFixed(2)}%</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">时长完成率</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.minuteCompletionRate.toFixed(2)}%</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">总任务数</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.totalTasks}</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">已完成任务</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.completedTasks}</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">临时任务数</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.adHocTasks}</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">计划时长</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.plannedMinutes} 分钟</p>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">实际完成时长</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summaryQuery.data.completedMinutes} 分钟</p>
            </article>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex lg:min-h-0 lg:flex-col">
        <h2 className="text-xl font-semibold text-slate-900">回顾内容</h2>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-slate-700">
            按日期查看
            <input
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => {
                setReviewDate(event.target.value)
                setReviewPage(1)
              }}
              type="date"
              value={reviewDate}
            />
          </label>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setReviewDate('')
              setReviewPage(1)
            }}
            type="button"
          >
            清空筛选
          </button>
        </div>

        {reviewsQuery.isLoading ? <p className="mt-4 text-slate-600">加载回顾中...</p> : null}

        <div className="mt-4 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {reviewsQuery.data?.items.length === 0 ? <p className="text-slate-600">暂无回顾内容。</p> : null}

          {reviewsQuery.data?.items.map((item) => (
            <article className="rounded-xl border border-slate-200 p-4" key={item.checkinId}>
              <p className="text-sm font-medium text-slate-800">
                {toLocalDateTimeInput(item.windowStart)} - {toLocalDateTimeInput(item.windowEnd)}
              </p>
              {item.overallComment ? <p className="mt-2 text-sm text-slate-700">总结：{item.overallComment}</p> : null}
              <div className="mt-2 space-y-1">
                {item.records.map((record, index) => {
                  const href = record.referenceLink ? normalizeReferenceLink(record.referenceLink) : null
                  return (
                    <div className="text-sm text-slate-700" key={`${item.checkinId}-${record.taskInstanceId ?? index}`}>
                      <span>+{record.addedMinutes} 分钟</span>
                      {record.comment ? <span className="ml-2">备注：{record.comment}</span> : null}
                      {href ? (
                        <a className="ml-3 font-medium text-teal-700 hover:text-teal-600" href={href} rel="noreferrer" target="_blank">
                          打开链接
                        </a>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            共 {reviewsQuery.data?.total ?? 0} 条，当前第 {reviewsQuery.data?.page ?? 1}/{reviewsQuery.data?.totalPages ?? 0} 页
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={(reviewsQuery.data?.page ?? 1) <= 1}
              onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              上一页
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={!reviewsQuery.data || reviewsQuery.data.totalPages === 0 || reviewsQuery.data.page >= reviewsQuery.data.totalPages}
              onClick={() => setReviewPage((prev) => prev + 1)}
              type="button"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
