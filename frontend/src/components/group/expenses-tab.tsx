import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { expensesApi } from '@/lib/api'
import { formatMoney } from '@/lib/format'
import { AddExpenseDialog } from '@/components/group/add-expense-dialog'

const SPLIT_LABELS: Record<string, string> = {
  EQUAL: 'Split equally',
  EXACT: 'Exact amounts',
  PERCENTAGE: 'Split by percentage',
  SHARES: 'Split by shares',
}

export function ExpensesTab({ groupId }: { groupId: number }) {
  const expensesQuery = useQuery({
    queryKey: ['groups', groupId, 'expenses'],
    queryFn: () => expensesApi.list(groupId),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddExpenseDialog groupId={groupId} />
      </div>

      {expensesQuery.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {expensesQuery.isSuccess && expensesQuery.data.content.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Receipt className="size-8" />
            <p>No expenses yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {expensesQuery.data?.content.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="flex items-start justify-between pt-6">
              <div className="space-y-1">
                <p className="font-medium">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  Paid by{' '}
                  <span className="font-medium text-foreground">
                    {expense.splits.find((s) => s.userId === expense.paidByUserId)?.userName ??
                      `User ${expense.paidByUserId}`}
                  </span>{' '}
                  · {new Date(expense.createdAt).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="outline">{SPLIT_LABELS[expense.splitType]}</Badge>
                  {expense.splits.map((split) => (
                    <Badge key={split.userId} variant="secondary" className="font-normal">
                      {split.userName}: {formatMoney(split.shareAmount, expense.currency)}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-lg font-semibold whitespace-nowrap">
                {formatMoney(expense.totalAmount, expense.currency)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
