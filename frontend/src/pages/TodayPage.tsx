import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import { createManualTask, deleteTask, generatePlanForDate, getTasksByDate, setTaskStatus, updateTask } from '@/features/tasks/api'
import { todayDate } from '@/shared/lib/date'
import type { TaskInstanceResponse, TaskStatus } from '@/shared/api/types'

function toEditForm(task: TaskInstanceResponse) {
  return {
    title: task.title,
    description: task.description ?? '',
    planDate: task.planDate,
    plannedStartTime: task.plannedStartTime ?? '',
    plannedMinutes: task.plannedMinutes,
    status: task.status,
  }
}

export function TodayPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayDate())
  const [title, setTitle] = useState('')
  const [plannedMinutes, setPlannedMinutes] = useState(30)
  const [plannedStartTime, setPlannedStartTime] = useState('')
  const [description, setDescription] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{
    title: string
    description: string
    planDate: string
    plannedStartTime: string
    plannedMinutes: number
    status: TaskStatus
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const tasksQuery = useQuery({
    queryKey: ['tasks', date],
    queryFn: () => getTasksByDate(date),
  })

  const createMutation = useMutation({
    mutationFn: createManualTask,
    onSuccess: () => {
      setTitle('')
      setDescription('')
      setPlannedMinutes(30)
      setPlannedStartTime('')
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
    onError: (error) => {
      setErrorMessage((error as ApiError).message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: Parameters<typeof updateTask>[1] }) => updateTask(taskId, payload),
    onSuccess: () => {
      setEditingTaskId(null)
      setEditForm(null)
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
    onError: (error) => {
      setErrorMessage((error as ApiError).message)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) => setTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
  })

  const generateMutation = useMutation({
    mutationFn: generatePlanForDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
  })

  const statusOptions = useMemo<TaskStatus[]>(() => ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], [])

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">今日任务</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-slate-700">
            日期
            <input
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <button
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate(date)}
            type="button"
          >
            {generateMutation.isPending ? '生成中...' : '生成当日计划'}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {tasksQuery.isLoading ? <p className="text-slate-600">加载任务中...</p> : null}
          {tasksQuery.data?.length === 0 ? <p className="text-slate-600">暂无任务，可以先添加手动任务。</p> : null}
          {tasksQuery.data?.map((task) => {
            const isEditing = editingTaskId === task.id && editForm
            return (
              <article className="rounded-xl border border-slate-200 p-4" key={task.id}>
                {isEditing ? (
                  <form
                    className="grid gap-2 md:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!editForm) {
                        return
                      }
                      setErrorMessage(null)
                      updateMutation.mutate({
                        taskId: task.id,
                        payload: {
                          title: editForm.title,
                          description: editForm.description || undefined,
                          planDate: editForm.planDate,
                          plannedStartTime: editForm.plannedStartTime || undefined,
                          plannedMinutes: editForm.plannedMinutes,
                          status: editForm.status,
                        },
                      })
                    }}
                  >
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                      required
                      value={editForm.title}
                    />
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, status: event.target.value as TaskStatus } : prev))
                      }
                      value={editForm.status}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, planDate: event.target.value } : prev))}
                      required
                      type="date"
                      value={editForm.planDate}
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => setEditForm((prev) => (prev ? { ...prev, plannedStartTime: event.target.value } : prev))}
                      type="time"
                      value={editForm.plannedStartTime}
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      max={720}
                      min={5}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, plannedMinutes: Number(event.target.value) } : prev))
                      }
                      required
                      type="number"
                      value={editForm.plannedMinutes}
                    />
                    <textarea
                      className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                      }
                      rows={2}
                      value={editForm.description}
                    />
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                        type="submit"
                      >
                        保存
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setEditingTaskId(null)
                          setEditForm(null)
                        }}
                        type="button"
                      >
                        取消
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">{task.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{task.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{task.description || '无描述'}</p>
                    <p className="mt-2 text-sm text-slate-700">
                      日期 {task.planDate}
                      {task.plannedStartTime ? ` ${task.plannedStartTime}` : ''} · 计划 {task.plannedMinutes} 分钟，已完成 {task.completedMinutes}{' '}
                      分钟
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setEditingTaskId(task.id)
                          setEditForm(toEditForm(task))
                          setErrorMessage(null)
                        }}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => statusMutation.mutate({ taskId: task.id, status: 'COMPLETED' })}
                        type="button"
                      >
                        标记完成
                      </button>
                      <button
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => statusMutation.mutate({ taskId: task.id, status: 'CANCELLED' })}
                        type="button"
                      >
                        取消任务
                      </button>
                      <button
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => deleteMutation.mutate(task.id)}
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">添加任务</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            setErrorMessage(null)
            createMutation.mutate({
              title,
              description: description || undefined,
              planDate: date,
              plannedStartTime: plannedStartTime || undefined,
              plannedMinutes,
            })
          }}
        >
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            标题
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            计划时长（分钟）
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              max={720}
              min={5}
              onChange={(event) => setPlannedMinutes(Number(event.target.value))}
              required
              type="number"
              value={plannedMinutes}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            日期
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            开始时间（可选）
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setPlannedStartTime(event.target.value)}
              type="time"
              value={plannedStartTime}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            描述
            <textarea
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              value={description}
            />
          </label>

          {errorMessage ? <p className="text-sm text-red-600 md:col-span-2">{errorMessage}</p> : null}

          <button
            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600 disabled:opacity-60 md:col-span-2"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? '保存中...' : '新增任务'}
          </button>
        </form>
      </div>
    </section>
  )
}
