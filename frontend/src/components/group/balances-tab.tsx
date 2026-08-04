import { useQuery } from '@tanstack/react-query'
import { Scale } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { EmptyState } from '@/components/empty-state'
import { balancesApi } from '@/lib/api'
import { formatMoney } from '@/lib/format'
import { BalanceChart } from '@/components/group/balance-chart'
import { cn } from '@/lib/utils'

export function BalancesTab({ groupId }: { groupId: number }) {
  const balancesQuery = useQuery({
    queryKey: ['groups', groupId, 'balances'],
    queryFn: () => balancesApi.list(groupId),
  })

  if (balancesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  const balances = balancesQuery.data ?? []
  if (balances.length === 0) {
    return <EmptyState icon={<Scale className="size-6" />} message="No members yet." />
  }

  const maxAbsBalance = Math.max(1, ...balances.map((b) => Math.abs(b.netBalance)))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Relative Balance
        </h3>
        <BalanceChart balances={balances} />
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
          <Scale className="size-4 text-brand" />
          <h3 className="text-sm font-bold text-foreground">
            Member Balances
          </h3>
        </div>

        <div className="divide-y divide-border/30">
          {balances.map((balance) => {
            const absBalance = Math.abs(balance.netBalance)
            const barPercentage = balance.netBalance === 0 ? 0 : Math.max((absBalance / maxAbsBalance) * 100, 3)

            return (
              <div key={balance.userId} className="py-2 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar name={balance.userName} seed={balance.userId} size="sm" />
                    <span className="text-sm font-medium truncate">{balance.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'size-1.5 rounded-full shrink-0',
                        balance.netBalance > 0 && 'bg-positive',
                        balance.netBalance < 0 && 'bg-negative',
                        balance.netBalance === 0 && 'bg-muted-foreground/40',
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-xs tabular-nums text-foreground/80 font-medium">
                      {balance.netBalance === 0 ? (
                        <span className="text-muted-foreground font-medium">Settled up</span>
                      ) : (
                        <>
                          {balance.netBalance > 0 ? (
                            <>
                              <span className="text-muted-foreground">is owed </span>
                              <span className="text-positive font-bold">{formatMoney(absBalance)}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">owes </span>
                              <span className="text-negative font-bold">{formatMoney(absBalance)}</span>
                            </>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-300',
                      balance.netBalance > 0 && 'bg-positive',
                      balance.netBalance < 0 && 'bg-negative',
                      balance.netBalance === 0 && 'bg-muted-foreground/30',
                    )}
                    style={{ width: `${barPercentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
