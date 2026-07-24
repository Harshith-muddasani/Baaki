import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight, CircleCheck, HandCoins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  groupMembersApi,
  settlementSuggestionsApi,
  settlementsApi,
  getErrorMessage,
} from '@/lib/api'
import { formatMoney, rupeesToMinorUnits } from '@/lib/format'
import type { SettlementSuggestionResponse } from '@/lib/types'

export function SettleUpTab({ groupId }: { groupId: number }) {
  const queryClient = useQueryClient()
  const [customOpen, setCustomOpen] = useState(false)

  const suggestionsQuery = useQuery({
    queryKey: ['groups', groupId, 'suggestions'],
    queryFn: () => settlementSuggestionsApi.list(groupId),
  })
  const membersQuery = useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: () => groupMembersApi.list(groupId),
  })
  const nameById = new Map(membersQuery.data?.map((m) => [m.userId, m.userName]))
  const nameOf = (userId: number) => nameById.get(userId) ?? `User ${userId}`

  const invalidateAfterSettlement = () => {
    queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'suggestions'] })
    queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'balances'] })
  }

  const recordSettlement = useMutation({
    mutationFn: (body: { paidByUserId: number; paidToUserId: number; amount: number }) =>
      settlementsApi.create(groupId, body, crypto.randomUUID()),
    onSuccess: () => {
      toast.success('Settlement recorded')
      invalidateAfterSettlement()
      setCustomOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleRecordSuggestion = (suggestion: SettlementSuggestionResponse) => {
    recordSettlement.mutate({
      paidByUserId: suggestion.fromUserId,
      paidToUserId: suggestion.toUserId,
      amount: suggestion.amount,
    })
  }

  const handleCustomSubmit = (formData: FormData) => {
    recordSettlement.mutate({
      paidByUserId: Number(formData.get('paidByUserId')),
      paidToUserId: Number(formData.get('paidToUserId')),
      amount: rupeesToMinorUnits(Number(formData.get('amount'))),
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Suggested settlements</p>
            <Dialog open={customOpen} onOpenChange={setCustomOpen}>
              <DialogTrigger
                render={
                  <Button size="sm" variant="outline">
                    <HandCoins /> Record a payment
                  </Button>
                }
              />
              <DialogContent>
                <form action={handleCustomSubmit}>
                  <DialogHeader>
                    <DialogTitle>Record a settlement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <div className="space-y-1.5">
                      <Label>Paid by</Label>
                      <Select name="paidByUserId" required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Who paid?" />
                        </SelectTrigger>
                        <SelectContent>
                          {membersQuery.data?.map((m) => (
                            <SelectItem key={m.userId} value={String(m.userId)}>
                              {m.userName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Paid to</Label>
                      <Select name="paidToUserId" required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Who received it?" />
                        </SelectTrigger>
                        <SelectContent>
                          {membersQuery.data?.map((m) => (
                            <SelectItem key={m.userId} value={String(m.userId)}>
                              {m.userName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={recordSettlement.isPending}>
                      Record settlement
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {suggestionsQuery.isLoading && <Skeleton className="h-24" />}

          {suggestionsQuery.isSuccess && suggestionsQuery.data.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <CircleCheck className="size-8 text-emerald-600" />
              <p className="text-sm">Everyone's settled up.</p>
            </div>
          )}

          <div className="space-y-2">
            {suggestionsQuery.data?.map((suggestion, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{nameOf(suggestion.fromUserId)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-medium">{nameOf(suggestion.toUserId)}</span>
                  <span className="text-muted-foreground">{formatMoney(suggestion.amount)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRecordSuggestion(suggestion)}
                  disabled={recordSettlement.isPending}
                >
                  Mark as paid
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
