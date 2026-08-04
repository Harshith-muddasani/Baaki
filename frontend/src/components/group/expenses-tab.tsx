import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Receipt, ChevronDown, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { EmptyState } from '@/components/empty-state'
import { Input } from '@/components/ui/input'
import { expensesApi } from '@/lib/api'
import { formatMoney } from '@/lib/format'
import { fadeInUp } from '@/lib/motion'
import { AddExpenseDialog } from '@/components/group/add-expense-dialog'
import { CategoryBadge } from '@/components/category-badge'
import { detectCategory, CATEGORIES, type ExpenseCategory } from '@/lib/category'
import { cn } from '@/lib/utils'

const SPLIT_LABELS: Record<string, string> = {
  EQUAL: 'Split equally',
  EXACT: 'Split by exact amount',
  PERCENTAGE: 'Split by percentage',
  SHARES: 'Split by shares',
}

export function ExpensesTab({ groupId }: { groupId: number }) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  const expensesQuery = useQuery({
    queryKey: ['groups', groupId, 'expenses'],
    queryFn: () => expensesApi.list(groupId),
  })

  const expenses = expensesQuery.data?.content || []
  
  const filteredExpenses = expenses.filter(expense => {
    const cat: ExpenseCategory = (expense as unknown as { category?: ExpenseCategory }).category || detectCategory(expense.description)
    if (categoryFilter !== 'ALL' && cat !== categoryFilter) return false
    if (search && !expense.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..." 
            className="pl-9 bg-card w-full"
          />
        </div>
        <div className="flex justify-end">
          <AddExpenseDialog groupId={groupId} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
            categoryFilter === 'ALL' 
              ? "bg-foreground text-background border-foreground" 
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          All
        </button>
        {Object.values(CATEGORIES).map((cat) => {
          const isSelected = categoryFilter === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5",
                isSelected
                  ? `${cat.bgClass} ${cat.textClass} ${cat.borderClass} ring-1 ring-inset ring-current/20` 
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <cat.icon className="size-3.5" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {expensesQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-[72px] rounded-xl" />
        </div>
      )}

      {expensesQuery.isSuccess && expenses.length === 0 && (
        <EmptyState icon={<Receipt className="size-8 text-muted-foreground/60" />} message="No expenses yet — add the first one." />
      )}

      {expensesQuery.isSuccess && expenses.length > 0 && filteredExpenses.length === 0 && (
        <EmptyState icon={<Search className="size-8 text-muted-foreground/60" />} message="No expenses found matching your criteria." />
      )}

      {expensesQuery.isSuccess && filteredExpenses.length > 0 && (
        <div className="space-y-3">
          {filteredExpenses.map((expense, i) => {
            const payer = expense.splits.find((s) => s.userId === expense.paidByUserId)
            const others = expense.splits.filter((s) => s.userId !== expense.paidByUserId)
            const cat: ExpenseCategory = (expense as unknown as { category?: ExpenseCategory }).category || detectCategory(expense.description)
            const isExpanded = expandedId === expense.id

            return (
              <motion.div
                key={expense.id}
                {...fadeInUp(i)}
                className={cn(
                  "p-3 rounded-xl bg-card border shadow-premium transition-all duration-300 ease-out cursor-pointer flex flex-col",
                  isExpanded ? "border-brand/40 shadow-glow-brand" : "border-border/45 hover:border-brand/20 hover:shadow-lg hover:-translate-y-0.5"
                )}
                onClick={() => setExpandedId(isExpanded ? null : expense.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={payer?.userName ?? '?'} seed={expense.paidByUserId} className="shadow-sm" size="md" />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{expense.description}</p>
                        <CategoryBadge category={cat} size="sm" />
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{payer?.userName ?? `User ${expense.paidByUserId}`}</span> paid ·{' '}
                        {SPLIT_LABELS[expense.splitType]}
                        {others.length > 0 && ` · with ${others.length} other${others.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3 shrink-0">
                    <div>
                      <p className="text-sm font-bold text-foreground tabular-nums tracking-tight">
                        {formatMoney(expense.totalAmount, expense.currency)}
                      </p>
                      <p className="text-[11px] font-medium mt-0.5 whitespace-nowrap text-muted-foreground/80">
                        {new Date(expense.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Split Details</span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(expense.createdAt).toLocaleString(undefined, { 
                              dateStyle: 'medium', 
                              timeStyle: 'short' 
                            })}
                          </span>
                        </div>
                        <div className="space-y-2 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                          {expense.splits.map((split) => (
                            <div key={split.userId} className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={split.userName ?? '?'} seed={split.userId} size="sm" />
                                <span className="text-xs font-medium text-foreground">
                                  {split.userName} {split.userId === expense.paidByUserId && <span className="text-muted-foreground font-normal">(paid)</span>}
                                </span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-foreground">
                                {formatMoney(split.shareAmount, expense.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
