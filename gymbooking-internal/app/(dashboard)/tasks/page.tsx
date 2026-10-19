import { TaskListClient } from '@/components/tasks/TaskListClient'

export const metadata = {
  title: 'Tareas y Seguimientos',
  description: 'Gestión de actividades comerciales y operativas de GymBooking',
}

export default function TasksPage() {
  return (
    <div className="p-6 h-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tareas y Seguimientos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de actividades comerciales y operativas
          </p>
        </div>
      </div>
      <TaskListClient />
    </div>
  )
}
