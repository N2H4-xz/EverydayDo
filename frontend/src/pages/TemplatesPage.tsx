import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTemplate, deleteTemplate, getTemplates, setTemplateEnabled, updateTemplate } from '@/features/templates/api'
import type { RecurrenceType, TaskTemplateResponse, UpdateTaskTemplatePayload } from '@/shared/api/types'
import { ApiError } from '@/shared/api/client'

const recurrenceOptions: RecurrenceType[] = ['DAILY', 'WORKDAY', 'HOLIDAY', 'WEEKLY', 'SPECIFIC_DATE', 'INTERVAL_DAYS']

function parseNumberInput(rawValue: string) {
  const normalizedValue = rawValue.replace(/^0+(?=\d)/, '')
  const nextValue = normalizedValue === '' ? 0 : Number(normalizedValue)
  return { normalizedValue, nextValue }
}

function toForm(template?: TaskTemplateResponse): UpdateTaskTemplatePayload {
  return {
    title: template?.title ?? '',
    description: template?.description ?? '',
    estimatedMinutes: template?.estimatedMinutes ?? 30,
    priority: template?.priority ?? 3,
    recurrenceType: template?.recurrenceType ?? 'DAILY',
    dayOfWeek: template?.dayOfWeek ?? 1,
    specificDate: template?.specificDate ?? '',
    intervalDays: template?.intervalDays ?? 1,
    defaultStartTime: template?.defaultStartTime ?? '',
    activeFrom: template?.activeFrom ?? '',
    activeTo: template?.activeTo ?? '',
    enabled: template?.enabled ?? true,
  }
}

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [form, setForm] = useState<UpdateTaskTemplatePayload>(toForm())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      setForm(toForm())
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error) => {
      setErrorMessage((error as ApiError).message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: number; payload: UpdateTaskTemplatePayload }) =>
      updateTemplate(templateId, payload),
    onSuccess: () => {
      setEditingTemplateId(null)
      setForm(toForm())
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error) => {
      setErrorMessage((error as ApiError).message)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ templateId, enabled }: { templateId: number; enabled: boolean }) => setTemplateEnabled(templateId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      if (editingTemplateId) {
        setEditingTemplateId(null)
        setForm(toForm())
      }
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const submitText = useMemo(() => {
    if (createMutation.isPending || updateMutation.isPending) {
      return '提交中...'
    }
    return editingTemplateId ? '保存模板' : '创建周期任务'
  }, [createMutation.isPending, editingTemplateId, updateMutation.isPending])

  return (
    <section className="grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex lg:min-h-0 lg:flex-col">
        <h2 className="text-xl font-semibold text-slate-900">周期任务列表</h2>
        <div className="mt-4 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {templatesQuery.isLoading ? <p className="text-slate-600">加载中...</p> : null}
          {templatesQuery.data?.length === 0 ? <p className="text-slate-600">还没有周期任务，先创建一个。</p> : null}
          {templatesQuery.data?.map((template) => (
            <article className="rounded-xl border border-slate-200 p-4" key={template.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{template.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {template.recurrenceType}
                    {template.recurrenceType === 'INTERVAL_DAYS' && template.intervalDays
                      ? `（每 ${template.intervalDays} 天）`
                      : ''}{' '}
                    · {template.estimatedMinutes} 分钟 · 优先级 {template.priority}
                  </p>
                  {template.defaultStartTime ? <p className="text-xs text-slate-500">默认开始：{template.defaultStartTime}</p> : null}
                  {template.activeFrom || template.activeTo ? (
                    <p className="text-xs text-slate-500">
                      有效期：{template.activeFrom ?? '不限'} ~ {template.activeTo ?? '不限'}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">状态：{template.enabled ? '启用' : '停用'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setEditingTemplateId(template.id)
                      setForm(toForm(template))
                      setErrorMessage(null)
                    }}
                    type="button"
                  >
                    编辑
                  </button>
                  <button
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate({ templateId: template.id, enabled: !template.enabled })}
                    type="button"
                  >
                    {template.enabled ? '停用' : '启用'}
                  </button>
                  <button
                    className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(template.id)}
                    type="button"
                  >
                    删除
                  </button>
                </div>
              </div>
              {template.description ? <p className="mt-2 text-sm text-slate-700">{template.description}</p> : null}
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <h2 className="text-xl font-semibold text-slate-900">{editingTemplateId ? '编辑周期任务' : '新建周期任务'}</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            setErrorMessage(null)
            const payload = {
              ...form,
              description: form.description || undefined,
              dayOfWeek: form.recurrenceType === 'WEEKLY' ? form.dayOfWeek : undefined,
              specificDate: form.recurrenceType === 'SPECIFIC_DATE' ? form.specificDate : undefined,
              intervalDays: form.recurrenceType === 'INTERVAL_DAYS' ? form.intervalDays : undefined,
              defaultStartTime: form.defaultStartTime || undefined,
              activeFrom: form.activeFrom || undefined,
              activeTo: form.activeTo || undefined,
            }
            if (editingTemplateId) {
              updateMutation.mutate({ templateId: editingTemplateId, payload })
            } else {
              createMutation.mutate(payload)
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            标题
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
              value={form.title}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            描述
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={2}
              value={form.description}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-slate-700">
              时长（分钟）
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={720}
                min={5}
                onChange={(event) => {
                  const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                  if (event.target.value !== normalizedValue) {
                    event.target.value = normalizedValue
                  }
                  setForm((prev) => ({ ...prev, estimatedMinutes: nextValue }))
                }}
                required
                type="number"
                value={form.estimatedMinutes}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              优先级
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={5}
                min={1}
                onChange={(event) => {
                  const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                  if (event.target.value !== normalizedValue) {
                    event.target.value = normalizedValue
                  }
                  setForm((prev) => ({ ...prev, priority: nextValue }))
                }}
                required
                type="number"
                value={form.priority}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            重复类型
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setForm((prev) => ({ ...prev, recurrenceType: event.target.value as RecurrenceType }))}
              value={form.recurrenceType}
            >
              {recurrenceOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {form.recurrenceType === 'WEEKLY' ? (
            <label className="block text-sm font-medium text-slate-700">
              周几（1-7）
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={7}
                min={1}
                onChange={(event) => {
                  const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                  if (event.target.value !== normalizedValue) {
                    event.target.value = normalizedValue
                  }
                  setForm((prev) => ({ ...prev, dayOfWeek: nextValue }))
                }}
                required
                type="number"
                value={form.dayOfWeek}
              />
            </label>
          ) : null}

          {form.recurrenceType === 'SPECIFIC_DATE' ? (
            <label className="block text-sm font-medium text-slate-700">
              指定日期
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, specificDate: event.target.value }))}
                required
                type="date"
                value={form.specificDate}
              />
            </label>
          ) : null}

          {form.recurrenceType === 'INTERVAL_DAYS' ? (
            <label className="block text-sm font-medium text-slate-700">
              间隔天数
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                max={365}
                min={1}
                onChange={(event) => {
                  const { normalizedValue, nextValue } = parseNumberInput(event.target.value)
                  if (event.target.value !== normalizedValue) {
                    event.target.value = normalizedValue
                  }
                  setForm((prev) => ({ ...prev, intervalDays: nextValue }))
                }}
                required
                type="number"
                value={form.intervalDays}
              />
            </label>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              默认开始时间
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, defaultStartTime: event.target.value }))}
                type="time"
                value={form.defaultStartTime}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              启用状态
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.value === 'true' }))}
                value={String(form.enabled)}
              >
                <option value="true">启用</option>
                <option value="false">停用</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              生效日期
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, activeFrom: event.target.value }))}
                required={form.recurrenceType === 'INTERVAL_DAYS'}
                type="date"
                value={form.activeFrom}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              结束日期
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, activeTo: event.target.value }))}
                type="date"
                value={form.activeTo}
              />
            </label>
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <div className="flex gap-2">
            <button
              className="w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              disabled={createMutation.isPending || updateMutation.isPending}
              type="submit"
            >
              {submitText}
            </button>
            {editingTemplateId ? (
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingTemplateId(null)
                  setForm(toForm())
                  setErrorMessage(null)
                }}
                type="button"
              >
                取消
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  )
}
