import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Plus, Users, PieChart as PieIcon, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupCard } from '@/components/group-card'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SpendingChart } from '@/components/group/spending-chart'
import { groupsApi, balancesApi, expensesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { formatMoney } from '@/lib/format'
import { fadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { currentUser } = useAuth()

  const groupsQuery = useQuery({
    queryKey: ['groups', currentUser?.id],
    queryFn: () => groupsApi.list(currentUser!.id),
    enabled: !!currentUser,
  })
  const groups = groupsQuery.data ?? []

  const balanceQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['groups', group.id, 'balances'],
      queryFn: () => balancesApi.list(group.id),
      enabled: groupsQuery.isSuccess,
    })),
  })

  // Fetch all group expenses for aggregated spending charts
  const expenseQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['groups', group.id, 'expenses'],
      queryFn: () => expensesApi.list(group.id),
      enabled: groupsQuery.isSuccess,
    })),
  })

  const isLoading = groupsQuery.isLoading || balanceQueries.some((q) => q.isLoading)

  const perGroup = groups.map((group, i) => {
    const mine = balanceQueries[i]?.data?.find((b) => b.userId === currentUser?.id)
    return { group, netBalance: mine?.netBalance ?? 0 }
  })

  const allExpenses = expenseQueries.flatMap((q) => q.data?.content ?? [])

  const totalOwedToYou = perGroup.reduce((sum, g) => sum + Math.max(g.netBalance, 0), 0)
  const totalYouOwe = perGroup.reduce((sum, g) => sum + Math.max(-g.netBalance, 0), 0)
  const net = totalOwedToYou - totalYouOwe
  const tone = net === 0 ? 'neutral' : net > 0 ? 'positive' : 'negative'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-brand uppercase">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}` : 'Welcome back'}
          </h1>
        </div>
        <Link to="/groups">
          <Button size="sm" className="font-semibold shadow-sm hover:shadow-md shadow-brand/10 rounded-xl h-8 text-xs px-3">
            <Plus className="size-3.5 mr-1" /> Manage Groups
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatTile
            label="Net Position"
            value={Math.abs(net) / 100}
            tone={tone === 'neutral' ? 'brand' : tone}
            icon={<Activity className="size-3.5" />}
            delay={0}
            sign={net < 0 ? '−' : ''}
          />
          <StatTile
            label="Owed to you"
            value={totalOwedToYou / 100}
            tone="positive"
            icon={<ArrowDownRight className="size-3.5" />}
            delay={0.05}
          />
          <StatTile
            label="You owe"
            value={totalYouOwe / 100}
            tone="negative"
            icon={<ArrowUpRight className="size-3.5" />}
            delay={0.1}
          />
          <StatTile
            label="Active Groups"
            value={groups.length}
            tone="brand"
            icon={<Users className="size-3.5" />}
            delay={0.15}
            isCount={true}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground tracking-tight">Your Groups</h2>
            <Link
              to="/groups"
              className="flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-brand"
            >
              View all <ChevronRight className="size-3" />
            </Link>
          </div>

          {groupsQuery.isLoading && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          )}

          {groupsQuery.isSuccess && groups.length === 0 && (
            <EmptyState
              icon={<Users className="size-8 text-muted-foreground/60" />}
              message="No groups yet."
              action={
                <Link to="/groups">
                  <Button size="sm" variant="outline" className="mt-2 font-semibold h-8 text-xs">
                    Create your first group
                  </Button>
                </Link>
              }
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {perGroup.slice(0, 6).map(({ group, netBalance }, i) => (
              <GroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                index={i}
                subtitle={netBalance === 0 ? 'Settled up' : netBalance > 0 ? 'You are owed' : 'You owe'}
                trailing={
                  netBalance !== 0 && (
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        netBalance > 0 ? 'text-positive' : 'text-negative',
                      )}
                    >
                      {formatMoney(Math.abs(netBalance))}
                    </span>
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            {allExpenses.length > 0 && (
              <motion.div
                {...fadeIn(0.15)}
                className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieIcon className="size-4 text-brand" />
                    <h2 className="text-sm font-bold text-foreground">Spending</h2>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">All groups</span>
                </div>
                <SpendingChart expenses={allExpenses} type="donut" />
              </motion.div>
            )}

            <motion.div
              {...fadeIn(0.2)}
              className="rounded-xl border border-border/40 bg-gradient-to-br from-brand-soft/20 to-card p-4 shadow-premium flex flex-col items-start gap-2"
            >
              <h3 className="text-sm font-bold text-foreground">Quick Action</h3>
              <p className="text-[11px] text-muted-foreground">Settle up your outstanding balances across groups.</p>
              <Link to="/groups" className="w-full mt-2">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 font-semibold rounded-lg hover:bg-brand-soft hover:text-brand border-border/60">
                  Settle Balances
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
  icon,
  delay,
  isCount = false,
  sign = '',
}: {
  label: string
  value: number
  tone: 'positive' | 'negative' | 'neutral' | 'brand'
  icon: React.ReactNode
  delay: number
  isCount?: boolean
  sign?: string
}) {
  const getGradient = () => {
    switch (tone) {
      case 'positive':
        return 'from-positive-soft/30 hover:border-positive/20'
      case 'negative':
        return 'from-negative-soft/30 hover:border-negative/20'
      case 'brand':
        return 'from-brand-soft/30 hover:border-brand/20'
      default:
        return 'from-muted/10 hover:border-border/60'
    }
  }

  const getIconBg = () => {
    switch (tone) {
      case 'positive':
        return 'bg-positive shadow-positive/10'
      case 'negative':
        return 'bg-negative shadow-negative/10'
      case 'brand':
        return 'bg-brand shadow-brand/10'
      default:
        return 'bg-muted-foreground shadow-sm'
    }
  }

  const getTextColor = () => {
    switch (tone) {
      case 'positive':
        return 'text-positive'
      case 'negative':
        return 'text-negative'
      case 'brand':
        return 'text-brand'
      default:
        return 'text-foreground'
    }
  }

  return (
    <motion.div
      {...fadeIn(delay)}
      className={cn(
        'flex flex-col justify-between rounded-xl p-3 border border-border/40 shadow-premium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-card',
        'bg-gradient-to-br to-card',
        getGradient()
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase line-clamp-1">
          {label}
        </p>
        <div
          className={cn(
            'flex size-6 items-center justify-center rounded-lg text-white shadow-sm transition-transform duration-300 hover:scale-105',
            getIconBg()
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <p className={cn('text-xl font-bold tracking-tight tabular-nums flex items-center', getTextColor())}>
          {isCount ? (
            value
          ) : (
            <>
              {sign}
              <AnimatedNumber value={value} prefix="₹" />
            </>
          )}
        </p>
      </div>
    </motion.div>
  )
}
