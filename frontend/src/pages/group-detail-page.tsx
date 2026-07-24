import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, Receipt, Scale, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { groupsApi } from '@/lib/api'
import { MembersTab } from '@/components/group/members-tab'
import { ExpensesTab } from '@/components/group/expenses-tab'
import { BalancesTab } from '@/components/group/balances-tab'
import { SettleUpTab } from '@/components/group/settle-up-tab'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const id = Number(groupId)

  const groupQuery = useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.get(id),
  })

  if (groupQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!groupQuery.data) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{groupQuery.data.name}</h1>
        <p className="text-sm text-muted-foreground">
          Created {new Date(groupQuery.data.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">
            <Receipt /> Expenses
          </TabsTrigger>
          <TabsTrigger value="balances">
            <Scale /> Balances
          </TabsTrigger>
          <TabsTrigger value="settle-up">
            <ArrowLeftRight /> Settle up
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users /> Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <ExpensesTab groupId={id} />
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
      </Tabs>
    </div>
  )
}
