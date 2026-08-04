import { formatMoney } from '@/lib/format'
import type { BalanceResponse } from '@/lib/types'

/**
 * Horizontal diverging bar chart, one row per member, baseline at zero.
 * Mark specs: ≤24px thick bars, 4px rounded at the data end, square at the
 * baseline, growing from a shared center line. Validated blue/red diverging
 * pair (see dataviz skill - green/red fails CVD separation, ΔE 4.1).
 * Value labels stay in text tokens; the bar itself carries the color.
 */
export function BalanceChart({ balances }: { balances: BalanceResponse[] }) {
  const maxAbs = Math.max(1, ...balances.map((b) => Math.abs(b.netBalance)))

  return (
    <div className="space-y-2.5">
      {balances.map((b) => {
        const pct = (Math.abs(b.netBalance) / maxAbs) * 100
        const isPositive = b.netBalance > 0
        const isNegative = b.netBalance < 0
        return (
          <div key={b.userId} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm text-muted-foreground" title={b.userName}>
              {b.userName}
            </span>
            <div className="relative h-5 flex-1">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <div className="absolute inset-0 flex">
                <div className="flex w-1/2 justify-end">
                  {isNegative && (
                    <div
                      className="h-5 max-h-5 rounded-l-sm bg-negative"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                <div className="flex w-1/2 justify-start">
                  {isPositive && (
                    <div
                      className="h-5 max-h-5 rounded-r-sm bg-positive"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-xs tabular-nums text-foreground">
              {b.netBalance === 0 ? '—' : formatMoney(Math.abs(b.netBalance))}
            </span>
          </div>
        )
      })}
    </div>
  )
}
