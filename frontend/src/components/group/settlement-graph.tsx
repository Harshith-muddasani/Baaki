import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { formatMoney } from '@/lib/format'
import type { SettlementSuggestionResponse } from '@/lib/types'

interface SettlementGraphProps {
  suggestions: SettlementSuggestionResponse[]
  nameOf: (userId: number) => string
  onSettle: (suggestion: SettlementSuggestionResponse) => void
  settling?: boolean
}

export function SettlementGraph({ suggestions, nameOf, onSettle, settling = false }: SettlementGraphProps) {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-border/30 rounded-2xl bg-positive/5">
        <Sparkles className="size-8 text-positive mb-2" />
        <p className="text-sm font-semibold text-foreground">Zero Net Debt</p>
        <p className="text-xs text-muted-foreground mt-1">Everyone in this group is fully settled up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Simplified Settlement Graph ({suggestions.length} transfer{suggestions.length > 1 ? 's' : ''})
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="group relative flex flex-col gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-premium transition-all duration-300 hover:shadow-lg hover:border-brand/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={nameOf(s.fromUserId)} seed={s.fromUserId} size="sm" className="ring-2 ring-negative/30" />
                <div>
                  <p className="text-xs font-bold text-foreground">{nameOf(s.fromUserId)}</p>
                  <span className="text-[10px] font-semibold text-negative uppercase">Debtor</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-brand tabular-nums bg-brand-soft/60 px-2 py-0.5 rounded-full border border-brand/20">
                  {formatMoney(s.amount)}
                </span>
                <ArrowRight className="size-4 text-brand mt-1 transition-transform group-hover:translate-x-1" />
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">{nameOf(s.toUserId)}</p>
                  <span className="text-[10px] font-semibold text-positive uppercase">Receiver</span>
                </div>
                <UserAvatar name={nameOf(s.toUserId)} seed={s.toUserId} size="sm" className="ring-2 ring-positive/30" />
              </div>
            </div>

            <Button
              size="sm"
              className="h-7 w-full rounded-lg text-[11px] font-semibold"
              onClick={() => onSettle(s)}
              disabled={settling}
            >
              Settle
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
