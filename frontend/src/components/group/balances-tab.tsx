import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { balancesApi } from '@/lib/api'
import { formatMoney } from '@/lib/format'

export function BalancesTab({ groupId }: { groupId: number }) {
  const balancesQuery = useQuery({
    queryKey: ['groups', groupId, 'balances'],
    queryFn: () => balancesApi.list(groupId),
  })

  return (
    <Card>
      <CardContent className="pt-6">
        {balancesQuery.isLoading && <Skeleton className="h-32" />}
        {balancesQuery.isSuccess && balancesQuery.data.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No members yet.</p>
        )}
        {balancesQuery.isSuccess && balancesQuery.data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Net balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balancesQuery.data.map((balance) => (
                <TableRow key={balance.userId}>
                  <TableCell className="font-medium">{balance.userName}</TableCell>
                  <TableCell className="text-right">
                    {balance.netBalance === 0 ? (
                      <Badge variant="secondary">Settled up</Badge>
                    ) : (
                      <span className={balance.netBalance > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {balance.netBalance > 0 ? 'is owed ' : 'owes '}
                        {formatMoney(Math.abs(balance.netBalance))}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
