import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTemplate, getTemplates } from '@/features/templates/api'
import type { RecurrenceType } from '@/shared/api/types'
import { ApiError } from '@/shared/api/client'

const recurrenceOptions: RecurrenceType[] = ['DAILY', 'WORKDAY', 'HOLIDAY', 'WEEKLY', 'SPECIFIC_DATE']

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [priority, setPriority] = useState(3)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('DAILY')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [specificDate, setSpecificDate] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      setTitle('')
      setEstimatedMinutes(30)
      setPriority(3)
      setRecurrenceType('DAILY')
      setDayOfWeek(1)
      setSpecificDate('')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error) => {
      setErrorMessage((error as ApiError).message)
    },
  })

  const createPayload = useMemo(() => {
    const payload: {
      title: string
      estimatedMinutes: number
      priority: number
      recurrenceType: RecurrenceType
      dayOfWeek?: number
      specificDate?: string
    } = {
      title,
      estimatedMinutes,
      priority,
      recurrenceType,
    }

    if (recurrenceType === 'WEEKLY') {
      payload.dayOfWeek = dayOfWeek
    }

    if (recurrenceType === 'SPECIFIC_DATE' && specificDate) {
      payload.specificDate = specificDate
    }

    return payload
  }, [dayOfWeek, estimatedMinutes, priority, recurrenceType, specificDate, title])

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">周期任务列表</h2>
        <div className="mt-4 space-y-3">
          {templatesQuery.isLoading ? <p className="text-slate-600">加载中...</p> : null}
          {templatesQuery.data?.length === 0 ? <p className="text-slate-600">还没有周期任务，先创建一个。</p> : null}
          {templatesQuery.data?.map((template) => (
            <article className="rounded-xl border border-slate-200 p-4" key={template.id}>
              <h3 className="font-semibold text-slate-900">{template.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {template.recurrenceType} · {template.estimatedMinutes} 分钟 · 优先级 {template.priority}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">新建周期任务</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            setErrorMessage(null)
            createMutation.mutate(createPayload)
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            标题
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-slate-700">
              时长（分钟）
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={720}
                min={5}
                onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
                required
                type="number"
                value={estimatedMinutes}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              优先级
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={5}
                min={1}
                onChange={(event) => setPriority(Number(event.target.value))}
                required
                type="number"
                value={priority}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            重复类型
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setRecurrenceType(event.target.value as RecurrenceType)}
              value={recurrenceType}
            >
              {recurrenceOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {recurrenceType === 'WEEKLY' ? (
            <label className="block text-sm font-medium text-slate-700">
              周几（1-7）
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={7}
                min={1}
                onChange={(event) => setDayOfWeek(Number(event.target.value))}
                type="number"
                value={dayOfWeek}
              />
            </label>
          ) : null}

          {recurrenceType === 'SPECIFIC_DATE' ? (
            <label className="block text-sm font-medium text-slate-700">
              指定日期
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setSpecificDate(event.target.value)}
                type="date"
                value={specificDate}
              />
            </label>
          ) : null}

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <button
            className="w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? '创建中...' : '创建周期任务'}
          </button>
        </form>
      </div>
    </section>
  )
}
