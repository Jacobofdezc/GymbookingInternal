import { PipelineBoard } from '@/components/pipeline/PipelineBoard'

export const metadata = {
  title: 'Pipeline Comercial',
  description: 'Seguimiento del proceso comercial por etapas',
}

export default function PipelinePage() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline Comercial</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Seguimiento del proceso comercial por etapas
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <PipelineBoard />
      </div>
    </div>
  )
}
