import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: ReactNode
  message: ReactNode
  action?: ReactNode
}

/** The "nothing here yet" treatment, shared so every list in the app agrees on it. */
export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <p className="text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  )
}
