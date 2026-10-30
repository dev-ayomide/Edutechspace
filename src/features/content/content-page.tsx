import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useMyStacks } from '@/features/lead/use-my-stacks'
import { leadKeys } from '@/features/lead/api'
import { friendlyError } from '@/lib/errors'
import type { Lesson, Module, ModuleWithLessons } from '@/types/domain'
import {
  contentKeys,
  deleteLesson,
  deleteModule,
  listModulesWithLessons,
  reorderLessons,
  reorderModules,
  setLessonPublished,
  setModulePublished,
} from './api'
import { LessonDialog } from './lesson-dialog'
import { ModuleCard } from './module-card'
import { ModuleDialog } from './module-dialog'
import { moveItem } from './reorder'

type LessonTarget = { module: ModuleWithLessons; lesson: Lesson | null }

export function ContentPage() {
  const queryClient = useQueryClient()
  const { stacks, selected, select, isPending: stacksPending, error: stacksError } = useMyStacks()
  const stackId = selected?.id ?? ''
  const modulesQuery = useQuery({
    queryKey: contentKeys.stack(stackId),
    queryFn: () => listModulesWithLessons(stackId),
    enabled: !!stackId,
  })

  const [moduleDialog, setModuleDialog] = useState<{ open: boolean; module: Module | null }>({
    open: false,
    module: null,
  })
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; target: LessonTarget | null }>({
    open: false,
    target: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: 'module'; module: Module } | { kind: 'lesson'; lesson: Lesson } | null
  >(null)

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: contentKeys.stack(stackId) })
    await queryClient.invalidateQueries({ queryKey: leadKeys.summary(stackId) })
  }
  const run = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: refresh,
    onError: (e) => toast.error(friendlyError(e)),
  })
  const modules = modulesQuery.data ?? []

  const confirmDelete = () => {
    if (!deleteTarget) return
    const action =
      deleteTarget.kind === 'module'
        ? () => deleteModule(deleteTarget.module.id)
        : () => deleteLesson(deleteTarget.lesson)
    run.mutate(action, {
      onSuccess: () => {
        toast.success(deleteTarget.kind === 'module' ? 'Module deleted.' : 'Lesson deleted.')
        setDeleteTarget(null)
      },
      onError: () => setDeleteTarget(null),
    })
  }

  if (stacksPending) {
    return (
      <>
        <PageHeader title="Content" />
        <LoadingState />
      </>
    )
  }
  if (stacksError) return <ErrorState message={friendlyError(stacksError)} />
  if (!selected) {
    return (
      <>
        <PageHeader title="Content" />
        <EmptyState
          title="No stack assigned yet"
          description="An admin assigns you to a stack before you can add content."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Content"
        description={`Modules and lessons for ${selected.name}. Drafts are hidden from students.`}
        actions={
          <Button onClick={() => setModuleDialog({ open: true, module: null })}>
            <Plus className="size-4" aria-hidden="true" />
            New module
          </Button>
        }
      />
      {stacks.length > 1 && (
        <div className="mb-6 max-w-xs">
          <label htmlFor="stack-select" className="mb-1.5 block text-sm font-medium">
            Stack
          </label>
          <Select id="stack-select" value={selected.id} onChange={(e) => select(e.target.value)}>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {modulesQuery.isPending && <LoadingState />}
      {modulesQuery.error && (
        <ErrorState
          message={friendlyError(modulesQuery.error)}
          onRetry={() => void modulesQuery.refetch()}
        />
      )}
      {modulesQuery.data && modules.length === 0 && (
        <EmptyState
          title="No modules yet"
          description="Start with the first module of the stack, then add its lessons."
          action={
            <Button onClick={() => setModuleDialog({ open: true, module: null })}>
              <Plus className="size-4" aria-hidden="true" />
              New module
            </Button>
          }
        />
      )}
      <div className="space-y-4">
        {modules.map((module, index) => (
          <ModuleCard
            key={module.id}
            module={module}
            index={index}
            total={modules.length}
            busy={run.isPending}
            onMoveModule={(dir) =>
              run.mutate(() =>
                reorderModules(
                  stackId,
                  moveItem(
                    modules.map((m) => m.id),
                    index,
                    dir,
                  ),
                ),
              )
            }
            onEditModule={() => setModuleDialog({ open: true, module })}
            onDeleteModule={() => setDeleteTarget({ kind: 'module', module })}
            onTogglePublishModule={() =>
              run.mutate(() => setModulePublished(module.id, !module.is_published))
            }
            onAddLesson={() => setLessonDialog({ open: true, target: { module, lesson: null } })}
            onMoveLesson={(i, dir) =>
              run.mutate(() =>
                reorderLessons(
                  module.id,
                  moveItem(
                    module.lessons.map((l) => l.id),
                    i,
                    dir,
                  ),
                ),
              )
            }
            onEditLesson={(lesson) => setLessonDialog({ open: true, target: { module, lesson } })}
            onDeleteLesson={(lesson) => setDeleteTarget({ kind: 'lesson', lesson })}
            onTogglePublishLesson={(lesson) =>
              run.mutate(() => setLessonPublished(lesson, !lesson.is_published))
            }
          />
        ))}
      </div>

      <ModuleDialog
        open={moduleDialog.open}
        onOpenChange={(open) => setModuleDialog((s) => ({ ...s, open }))}
        stackId={stackId}
        module={moduleDialog.module}
        onSaved={() => void refresh()}
      />
      {lessonDialog.target && (
        <LessonDialog
          open={lessonDialog.open}
          onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
          stackId={stackId}
          moduleId={lessonDialog.target.module.id}
          lesson={lessonDialog.target.lesson}
          onSaved={() => void refresh()}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={deleteTarget?.kind === 'module' ? 'Delete this module?' : 'Delete this lesson?'}
        description={
          deleteTarget?.kind === 'module'
            ? `"${deleteTarget.module.title}" and all of its lessons will be permanently deleted.`
            : deleteTarget
              ? `"${deleteTarget.lesson.title}" will be permanently deleted.`
              : ''
        }
        loading={run.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
