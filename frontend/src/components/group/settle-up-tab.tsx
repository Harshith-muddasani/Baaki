import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { HandCoins } from 'lucide-react'
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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
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
import { UserAvatar } from '@/components/user-avatar'
import { SettlementGraph } from '@/components/group/settlement-graph'
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

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      })
    } catch {
      // Ignore if canvas unsupported
    }
  }

  const recordSettlement = useMutation({
    mutationFn: (body: { paidByUserId: number; paidToUserId: number; amount: number }) =>
      settlementsApi.create(groupId, body, crypto.randomUUID()),
    onSuccess: () => {
      toast.success('Settlement recorded!')
      triggerCelebration()
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
      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Suggested Settlements</p>
          <Dialog open={customOpen} onOpenChange={setCustomOpen}>
            <DialogTrigger
              render={
                <Button size="sm" variant="outline" className="font-semibold rounded-lg h-7 text-[11px] px-2.5">
                  <HandCoins className="size-3 mr-0.5" /> Record payment
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md rounded-xl border border-border/40 bg-card shadow-xl">
              <form action={handleCustomSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-foreground">Record a settlement</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground/70">Paid by</Label>
                    <Select name="paidByUserId" required>
                      <SelectTrigger className="w-full h-9 rounded-lg text-xs">
                        <SelectValue placeholder="Who paid?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {membersQuery.data?.map((m) => (
                          <SelectItem key={m.userId} value={String(m.userId)}>
                            {m.userName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground/70">Paid to</Label>
                    <Select name="paidToUserId" required>
                      <SelectTrigger className="w-full h-9 rounded-lg text-xs">
                        <SelectValue placeholder="Who received it?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {membersQuery.data?.map((m) => (
                          <SelectItem key={m.userId} value={String(m.userId)}>
                            {m.userName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="amount" className="text-[11px] font-semibold text-foreground/70">Amount</Label>
                    <InputGroup className="rounded-lg overflow-hidden">
                      <InputGroupAddon className="bg-muted/50 font-bold text-xs">₹</InputGroupAddon>
                      <InputGroupInput
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="h-9 text-xs"
                        required
                      />
                    </InputGroup>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={recordSettlement.isPending} className="font-semibold h-9 text-xs rounded-lg">
                    Record settlement
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {suggestionsQuery.isLoading && <Skeleton className="h-20 rounded-xl" />}

        {suggestionsQuery.isSuccess && (
          <SettlementGraph suggestions={suggestionsQuery.data} nameOf={nameOf} />
        )}

        {/* Compact actionable list */}
        <div className="space-y-1.5">
          {suggestionsQuery.data?.map((suggestion, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/5 p-2.5 hover:bg-muted/15 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs">
                <UserAvatar name={nameOf(suggestion.fromUserId)} seed={suggestion.fromUserId} size="sm" />
                <span className="font-semibold text-foreground">{nameOf(suggestion.fromUserId)}</span>
                <span className="text-muted-foreground">→</span>
                <UserAvatar name={nameOf(suggestion.toUserId)} seed={suggestion.toUserId} size="sm" />
                <span className="font-semibold text-foreground">{nameOf(suggestion.toUserId)}</span>
                <span className="ml-1 tabular-nums font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full text-[11px]">
                  {formatMoney(suggestion.amount)}
                </span>
              </div>
              <Button
                size="sm"
                className="font-semibold rounded-lg h-7 px-2.5 text-[11px]"
                onClick={() => handleRecordSuggestion(suggestion)}
                disabled={recordSettlement.isPending}
              >
                Settle
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
