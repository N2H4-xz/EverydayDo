import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCheckinsByDate, getPendingWindow, submitHourlyCheckin } from '@/features/checkins/api'
import { todayDate, toLocalDateTimeInput } from '@/shared/lib/date'

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

export function CheckinsPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayDate())
  const [overallComment, setOverallComment] = useState('')
  const [minutesByTaskId, setMinutesByTaskId] = useState<Record<number, number>>({})
  const [linkEnabledByTaskId, setLinkEnabledByTaskId] = useState<Record<number, boolean>>({})
  const [linkByTaskId, setLinkByTaskId] = useState<Record<number, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const pendingQuery = useQuery({
    queryKey: ['checkins', 'pending'],
    queryFn: () => getPendingWindow(60),
  })

  const historyQuery = useQuery({
    queryKey: ['checkins', 'history', date],
    queryFn: () => getCheckinsByDate(date),
  })

  const submitMutation = useMutation({
    mutationFn: submitHourlyCheckin,
    onSuccess: () => {
      setOverallComment('')
      setMinutesByTaskId({})
      setLinkEnabledByTaskId({})
      setLinkByTaskId({})
      queryClient.invalidateQueries({ queryKey: ['checkins', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['checkins', 'history', date] })
    },
  })

  const payloadRecords = useMemo(() => {
    const plannedTasks = pendingQuery.data?.plannedTasks ?? []
    return plannedTasks
      .map((task) => {
        const normalizedLink = linkEnabledByTaskId[task.id]
          ? normalizeReferenceLink(linkByTaskId[task.id] ?? '')
          : null
        return {
          taskInstanceId: task.id,
          completedMinutes: minutesByTaskId[task.id] ?? 0,
          referenceLink: normalizedLink ?? undefined,
        }
      })
      .filter((record) => record.completedMinutes > 0)
  }, [linkByTaskId, linkEnabledByTaskId, minutesByTaskId, pendingQuery.data?.plannedTasks])

  const canSubmit =
    Boolean(pendingQuery.data) &&
    !pendingQuery.data?.submitted &&
    payloadRecords.length > 0 &&
    !submitMutation.isPending

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">当前窗口待打卡</h2>
        {pendingQuery.isLoading ? <p className="mt-3 text-slate-600">加载中...</p> : null}

        {pendingQuery.data ? (
          <>
            <p className="mt-2 text-sm text-slate-600">{pendingQuery.data.prompt}</p>
            <p className="mt-1 text-sm text-slate-700">
              {toLocalDateTimeInput(pendingQuery.data.windowStart)} - {toLocalDateTimeInput(pendingQuery.data.windowEnd)}
            </p>

            {pendingQuery.data.submitted ? (
              <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-700">该时间窗口已提交。</p>
            ) : null}

            <div className="mt-4 space-y-2">
              {pendingQuery.data.plannedTasks.map((task) => (
                <div className="rounded-lg border border-slate-200 p-3" key={task.id}>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <label className="mt-2 block text-xs text-slate-600">
                    本窗口完成分钟数
                    <input
                      className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1"
                      max={720}
                      min={0}
                      onChange={(event) =>
                        setMinutesByTaskId((prev) => ({
                          ...prev,
                          [task.id]: Number(event.target.value),
                        }))
                      }
                      type="number"
                      value={minutesByTaskId[task.id] ?? 0}
                    />
                  </label>

                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      checked={linkEnabledByTaskId[task.id] ?? false}
                      onChange={(event) =>
                        setLinkEnabledByTaskId((prev) => ({
                          ...prev,
                          [task.id]: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    添加链接
                  </label>

                  {linkEnabledByTaskId[task.id] ? (
                    <label className="mt-2 block text-xs text-slate-600">
                      链接地址
                      <input
                        className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1"
                        onChange={(event) =>
                          setLinkByTaskId((prev) => ({
                            ...prev,
                            [task.id]: event.target.value,
                          }))
                        }
                        placeholder="例如：www.bilibili.com/video/..."
                        type="url"
                        value={linkByTaskId[task.id] ?? ''}
                      />
                    </label>
                  ) : null}
                </div>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              总结备注
              <textarea
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setOverallComment(event.target.value)}
                rows={3}
                value={overallComment}
              />
            </label>

            {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}

            <button
              className="mt-4 w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              disabled={!canSubmit}
              onClick={() => {
                if (!pendingQuery.data || payloadRecords.length === 0) {
                  setFormError('请至少填写一个任务的完成分钟数。')
                  return
                }
                setFormError(null)
                submitMutation.mutate({
                  windowStart: pendingQuery.data.windowStart,
                  windowEnd: pendingQuery.data.windowEnd,
                  overallComment: overallComment || undefined,
                  records: payloadRecords,
                })
              }}
              type="button"
            >
              {submitMutation.isPending ? '提交中...' : '提交窗口打卡'}
            </button>
          </>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">历史打卡</h2>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          日期
          <input
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>

        <div className="mt-4 space-y-3">
          {historyQuery.isLoading ? <p className="text-slate-600">加载中...</p> : null}
          {historyQuery.data?.length === 0 ? <p className="text-slate-600">当天没有打卡记录。</p> : null}
          {historyQuery.data?.map((item) => (
            <article className="rounded-xl border border-slate-200 p-4" key={item.checkinId}>
              <p className="text-sm font-medium text-slate-800">
                {toLocalDateTimeInput(item.windowStart)} - {toLocalDateTimeInput(item.windowEnd)}
              </p>
              <p className="mt-1 text-sm text-slate-600">记录条数：{item.records.length}</p>
              <div className="mt-2 space-y-1">
                {item.records.map((record, index) => {
                  const href = record.referenceLink ? normalizeReferenceLink(record.referenceLink) : null
                  return (
                    <div className="text-sm text-slate-700" key={`${item.checkinId}-${record.taskInstanceId ?? index}`}>
                      <span>+{record.addedMinutes} 分钟</span>
                      {href ? (
                        <a
                          className="ml-3 font-medium text-teal-700 hover:text-teal-600"
                          href={href}
                          rel="noreferrer"
                          target="_blank"
                        >
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
      </div>
    </section>
  )
}
