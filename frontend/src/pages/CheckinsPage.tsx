import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import {
  deleteHourlyCheckin,
  getCheckinsByDate,
  getPendingWindowWithReference,
  submitHourlyCheckin,
  updateHourlyCheckin,
} from '@/features/checkins/api'
import { ApiError } from '@/shared/api/client'
import { toDateInputValue, toDateTimeLocalValue, todayDate, toLocalDateTimeInput } from '@/shared/lib/date'

function parseNumberInput(rawValue: string) {
  const normalizedValue = rawValue.replace(/^0+(?=\d)/, '')
  const nextValue = normalizedValue === '' ? 0 : Number(normalizedValue)
  return { normalizedValue, nextValue }
}

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
  const [windowMinutes, setWindowMinutes] = useState(60)
  const [referenceTime, setReferenceTime] = useState('')
  const [overallComment, setOverallComment] = useState('')
  const [minutesByTaskId, setMinutesByTaskId] = useState<Record<number, number>>({})
  const [linkEnabledByTaskId, setLinkEnabledByTaskId] = useState<Record<number, boolean>>({})
  const [linkByTaskId, setLinkByTaskId] = useState<Record<number, string>>({})
  const [adHocRows, setAdHocRows] = useState<Array<{ title: string; completedMinutes: number; referenceLink: string }>>([])
  const [editingCheckinId, setEditingCheckinId] = useState<number | null>(null)
  const [editingOverallComment, setEditingOverallComment] = useState('')
  const [editingRecords, setEditingRecords] = useState<
    Array<{
      taskInstanceId?: number
      title?: string
      completedMinutes: number
      comment?: string
      referenceLink?: string
    }>
  >([])
  const [formError, setFormError] = useState<string | null>(null)

  const pendingQuery = useQuery({
    queryKey: ['checkins', 'pending', windowMinutes, referenceTime],
    queryFn: () => getPendingWindowWithReference(windowMinutes, referenceTime || undefined),
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
      setAdHocRows([])
      queryClient.invalidateQueries({ queryKey: ['checkins', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['checkins', 'history', date] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      setFormError((error as ApiError).message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ checkinId, payload }: { checkinId: number; payload: Parameters<typeof updateHourlyCheckin>[1] }) =>
      updateHourlyCheckin(checkinId, payload),
    onSuccess: () => {
      setEditingCheckinId(null)
      setEditingOverallComment('')
      setEditingRecords([])
      queryClient.invalidateQueries({ queryKey: ['checkins', 'history', date] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      setFormError((error as ApiError).message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHourlyCheckin,
    onSuccess: () => {
      setEditingCheckinId(null)
      queryClient.invalidateQueries({ queryKey: ['checkins', 'history', date] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const payloadRecords = useMemo(() => {
    const plannedTasks = pendingQuery.data?.plannedTasks ?? []
    const plannedRecords = plannedTasks
      .map((task) => {
        const normalizedLink = linkEnabledByTaskId[task.id] ? normalizeReferenceLink(linkByTaskId[task.id] ?? '') : null
        return {
          taskInstanceId: task.id,
          completedMinutes: minutesByTaskId[task.id] ?? 0,
          referenceLink: normalizedLink ?? undefined,
        }
      })
      .filter((record) => record.completedMinutes > 0)

    const adHocRecords = adHocRows
      .map((item) => ({
        title: item.title.trim(),
        completedMinutes: item.completedMinutes,
        referenceLink: normalizeReferenceLink(item.referenceLink) ?? undefined,
      }))
      .filter((item) => item.title && item.completedMinutes > 0)

    return [...plannedRecords, ...adHocRecords]
  }, [adHocRows, linkByTaskId, linkEnabledByTaskId, minutesByTaskId, pendingQuery.data?.plannedTasks])

  const selectedReferenceDate = useMemo(() => {
    if (!referenceTime) {
      return null
    }
    const parsed = new Date(referenceTime)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }, [referenceTime])

  const selectedHistoryDate = useMemo(() => {
    const parsed = new Date(`${date}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [date])

  const canSubmit = Boolean(pendingQuery.data) && !pendingQuery.data?.submitted && payloadRecords.length > 0 && !submitMutation.isPending

  return (
    <section className="grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex lg:min-h-0 lg:flex-col">
        <h2 className="text-xl font-semibold text-slate-900">当前窗口待打卡</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            窗口分钟数
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              max={720}
              min={1}
              onChange={(event) => {
                const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                if (event.target.value !== normalizedValue) {
                  event.target.value = normalizedValue
                }
                setWindowMinutes(nextValue)
              }}
              type="number"
              value={windowMinutes}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            参考时间（可选）
            <DatePicker
              calendarClassName="ed-datepicker-calendar"
              className="ed-datepicker-input mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              dateFormat="yyyy/MM/dd HH:mm"
              isClearable
              onChange={(value: Date | null) => setReferenceTime(value ? toDateTimeLocalValue(value) : '')}
              placeholderText="请选择参考时间"
              popperClassName="ed-datepicker-popper"
              selected={selectedReferenceDate}
              showPopperArrow={false}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              wrapperClassName="w-full"
            />
          </label>
        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {pendingQuery.isLoading ? <p className="mt-3 text-slate-600">加载中...</p> : null}

          {pendingQuery.data ? (
            <>
            <p className="mt-2 text-sm text-slate-600">{pendingQuery.data.prompt}</p>
            <p className="mt-1 text-sm text-slate-700">
              {toLocalDateTimeInput(pendingQuery.data.windowStart)} - {toLocalDateTimeInput(pendingQuery.data.windowEnd)}
            </p>

            {pendingQuery.data.submitted ? <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-700">该时间窗口已提交。</p> : null}

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
                        {
                          const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                          if (event.target.value !== normalizedValue) {
                            event.target.value = normalizedValue
                          }
                          setMinutesByTaskId((prev) => ({
                            ...prev,
                            [task.id]: nextValue,
                          }))
                        }
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

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">补充临时任务</p>
                <button
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => setAdHocRows((prev) => [...prev, { title: '', completedMinutes: 0, referenceLink: '' }])}
                  type="button"
                >
                  添加一条
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {adHocRows.length === 0 ? <p className="text-xs text-slate-500">没有临时任务时可留空。</p> : null}
                {adHocRows.map((row, index) => (
                  <div className="grid gap-2 md:grid-cols-3" key={`adhoc-${index}`}>
                    <input
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      onChange={(event) =>
                        setAdHocRows((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value } : item)))
                      }
                      placeholder="临时任务标题"
                      value={row.title}
                    />
                    <input
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      min={0}
                      onChange={(event) => {
                        const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                        if (event.target.value !== normalizedValue) {
                          event.target.value = normalizedValue
                        }
                        setAdHocRows((prev) =>
                          prev.map((item, itemIndex) => (itemIndex === index ? { ...item, completedMinutes: nextValue } : item))
                        )
                      }}
                      placeholder="分钟"
                      type="number"
                      value={row.completedMinutes}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        onChange={(event) =>
                          setAdHocRows((prev) =>
                            prev.map((item, itemIndex) => (itemIndex === index ? { ...item, referenceLink: event.target.value } : item))
                          )
                        }
                        placeholder="参考链接（可选）"
                        value={row.referenceLink}
                      />
                      <button
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => setAdHocRows((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex lg:min-h-0 lg:flex-col">
        <h2 className="text-xl font-semibold text-slate-900">历史打卡</h2>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          日期
          <DatePicker
            calendarClassName="ed-datepicker-calendar"
            className="ed-datepicker-input mt-1 block rounded-lg border border-slate-300 px-3 py-2"
            dateFormat="yyyy/MM/dd"
            onChange={(value: Date | null) => {
              if (!value) {
                return
              }
              setDate(toDateInputValue(value))
            }}
            popperClassName="ed-datepicker-popper"
            selected={selectedHistoryDate}
            showPopperArrow={false}
            wrapperClassName="w-full"
          />
        </label>

        <div className="mt-4 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {historyQuery.isLoading ? <p className="text-slate-600">加载中...</p> : null}
          {historyQuery.data?.length === 0 ? <p className="text-slate-600">当天没有打卡记录。</p> : null}
          {historyQuery.data?.map((item) => {
            const isEditing = editingCheckinId === item.checkinId
            return (
              <article className="rounded-xl border border-slate-200 p-4" key={item.checkinId}>
                <p className="text-sm font-medium text-slate-800">
                  {toLocalDateTimeInput(item.windowStart)} - {toLocalDateTimeInput(item.windowEnd)}
                </p>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      onChange={(event) => setEditingOverallComment(event.target.value)}
                      placeholder="窗口总结"
                      rows={2}
                      value={editingOverallComment}
                    />
                    {editingRecords.map((record, index) => (
                      <div className="grid gap-2 rounded-lg border border-slate-200 p-2 md:grid-cols-3" key={`record-${index}`}>
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                          min={1}
                          onChange={(event) => {
                            const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                            if (event.target.value !== normalizedValue) {
                              event.target.value = normalizedValue
                            }
                            setEditingRecords((prev) =>
                              prev.map((itemRecord, itemIndex) =>
                                itemIndex === index ? { ...itemRecord, completedMinutes: nextValue } : itemRecord
                              )
                            )
                          }}
                          type="number"
                          value={record.completedMinutes}
                        />
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                          onChange={(event) =>
                            setEditingRecords((prev) =>
                              prev.map((itemRecord, itemIndex) =>
                                itemIndex === index ? { ...itemRecord, comment: event.target.value } : itemRecord
                              )
                            )
                          }
                          placeholder="备注"
                          value={record.comment ?? ''}
                        />
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                          onChange={(event) =>
                            setEditingRecords((prev) =>
                              prev.map((itemRecord, itemIndex) =>
                                itemIndex === index ? { ...itemRecord, referenceLink: event.target.value } : itemRecord
                              )
                            )
                          }
                          placeholder="参考链接"
                          value={record.referenceLink ?? ''}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        className="rounded-md bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-600"
                        onClick={() => {
                          setFormError(null)
                          updateMutation.mutate({
                            checkinId: item.checkinId,
                            payload: {
                              overallComment: editingOverallComment || undefined,
                              records: editingRecords.map((record) => ({
                                taskInstanceId: record.taskInstanceId,
                                title: record.taskInstanceId ? undefined : record.title || '历史临时任务',
                                completedMinutes: record.completedMinutes,
                                comment: record.comment,
                                referenceLink: normalizeReferenceLink(record.referenceLink ?? '') ?? undefined,
                              })),
                            },
                          })
                        }}
                        type="button"
                      >
                        保存修改
                      </button>
                      <button
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setEditingCheckinId(null)
                          setEditingOverallComment('')
                          setEditingRecords([])
                        }}
                        type="button"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-slate-600">记录条数：{item.records.length}</p>
                    {item.overallComment ? <p className="mt-1 text-sm text-slate-700">总结：{item.overallComment}</p> : null}
                    <div className="mt-2 space-y-1">
                      {item.records.map((record, index) => {
                        const href = record.referenceLink ? normalizeReferenceLink(record.referenceLink) : null
                        return (
                          <div className="text-sm text-slate-700" key={`${item.checkinId}-${record.taskInstanceId ?? index}`}>
                            <span>+{record.addedMinutes} 分钟</span>
                            {href ? (
                              <a className="ml-3 font-medium text-teal-700 hover:text-teal-600" href={href} rel="noreferrer" target="_blank">
                                打开链接
                              </a>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setEditingCheckinId(item.checkinId)
                          setEditingOverallComment(item.overallComment ?? '')
                          setEditingRecords(
                            item.records.map((record) => ({
                              taskInstanceId: record.taskInstanceId ?? undefined,
                              title: record.taskInstanceId ? undefined : '历史临时任务',
                              completedMinutes: record.addedMinutes,
                              comment: record.comment ?? '',
                              referenceLink: record.referenceLink ?? '',
                            }))
                          )
                        }}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => deleteMutation.mutate(item.checkinId)}
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
