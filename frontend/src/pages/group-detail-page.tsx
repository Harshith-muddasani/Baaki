import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowLeftRight, PieChart as PieIcon, Receipt, Scale, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { groupsApi, expensesApi } from '@/lib/api'
import { MembersTab } from '@/components/group/members-tab'
import { ExpensesTab } from '@/components/group/expenses-tab'
import { BalancesTab } from '@/components/group/balances-tab'
import { SettleUpTab } from '@/components/group/settle-up-tab'
import { SpendingChart } from '@/components/group/spending-chart'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const id = Number(groupId)

  const groupQuery = useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.get(id),
  })

  if (groupQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!groupQuery.data) return null

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          to="/groups"
          className="group inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-brand transition-colors"
        >
          <ArrowLeft className="size-3 transition-transform duration-200 group-hover:-translate-x-0.5" /> Groups
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{groupQuery.data.name}</h1>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Created {new Date(groupQuery.data.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="bg-muted/30 p-0.5 border border-border/30 rounded-lg">
          <TabsTrigger value="expenses" className="rounded-md font-semibold py-1 px-2.5 text-xs">
            <Receipt className="size-3.5 mr-0.5" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-md font-semibold py-1 px-2.5 text-xs">
            <PieIcon className="size-3.5 mr-0.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="balances" className="rounded-md font-semibold py-1 px-2.5 text-xs">
            <Scale className="size-3.5 mr-0.5" /> Balances
          </TabsTrigger>
          <TabsTrigger value="settle-up" className="rounded-md font-semibold py-1 px-2.5 text-xs">
            <ArrowLeftRight className="size-3.5 mr-0.5" /> Settle
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-md font-semibold py-1 px-2.5 text-xs">
            <Users className="size-3.5 mr-0.5" /> Members
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="expenses">
            <ExpensesTab groupId={id} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab groupId={id} />
          </TabsContent>
          <TabsContent value="balances">
            <BalancesTab groupId={id} />
          </TabsContent>
          <TabsContent value="settle-up">
            <SettleUpTab groupId={id} />
          </TabsContent>
          <TabsContent value="members">
            <MembersTab groupId={id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function AnalyticsTab({ groupId }: { groupId: number }) {
  const expensesQuery = useQuery({
    queryKey: ['groups', groupId, 'expenses'],
    queryFn: () => expensesApi.list(groupId),
  })

  const expenses = expensesQuery.data?.content ?? []

  if (expensesQuery.isLoading) return <Skeleton className="h-48 rounded-xl" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-3">
        <h3 className="text-xs font-bold text-foreground">Category Breakdown</h3>
        <SpendingChart expenses={expenses} type="donut" />
      </div>
      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-3">
        <h3 className="text-xs font-bold text-foreground">Spending Timeline</h3>
        <SpendingChart expenses={expenses} type="area" />
      </div>
    </div>
  )
}
