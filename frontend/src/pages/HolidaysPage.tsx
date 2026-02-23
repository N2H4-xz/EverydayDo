import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteHoliday, getHolidays, upsertHoliday } from '@/features/holidays/api'
import { ApiError } from '@/shared/api/client'
import { todayDate } from '@/shared/lib/date'

function monthRange(date: string) {
  const [year, month] = date.split('-').map(Number)
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
  return { start, end }
}

export function HolidaysPage() {
  const queryClient = useQueryClient()
  const initialMonth = todayDate().slice(0, 7)
  const { start, end } = monthRange(initialMonth)
  const [from, setFrom] = useState(start)
  const [to, setTo] = useState(end)
  const [holidayDate, setHolidayDate] = useState(todayDate())
  const [isHoliday, setIsHoliday] = useState(true)
  const [name, setName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const holidaysQuery = useQuery({
    queryKey: ['holidays', from, to],
    queryFn: () => getHolidays(from, to),
  })

  const upsertMutation = useMutation({
    mutationFn: upsertHoliday,
    onSuccess: () => {
      setName('')
      queryClient.invalidateQueries({ queryKey: ['holidays', from, to] })
    },
    onError: (error) => {
      setErrorMessage((error as ApiError).message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', from, to] })
    },
  })

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">节假日范围查看</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            从
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            到
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {holidaysQuery.isLoading ? <p className="text-slate-600">加载中...</p> : null}
          {holidaysQuery.data?.map((item) => (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3" key={item.holidayDate}>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.holidayDate}</p>
                <p className="text-xs text-slate-600">
                  {item.holiday ? '节假日' : '工作日'} · {item.customized ? '自定义' : '默认周末规则'}
                  {item.name ? ` · ${item.name}` : ''}
                </p>
              </div>
              {item.customized ? (
                <button
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                  onClick={() => deleteMutation.mutate(item.holidayDate)}
                  type="button"
                >
                  移除覆盖
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">新增/更新节假日覆盖</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            setErrorMessage(null)
            upsertMutation.mutate({
              holidayDate,
              isHoliday,
              name: name || undefined,
            })
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            日期
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setHolidayDate(event.target.value)}
              required
              type="date"
              value={holidayDate}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            类型
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setIsHoliday(event.target.value === 'holiday')}
              value={isHoliday ? 'holiday' : 'workday'}
            >
              <option value="holiday">节假日</option>
              <option value="workday">工作日</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            名称（可选）
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <button
            className="w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
            disabled={upsertMutation.isPending}
            type="submit"
          >
            {upsertMutation.isPending ? '提交中...' : '保存覆盖'}
          </button>
        </form>
      </div>
    </section>
  )
}
