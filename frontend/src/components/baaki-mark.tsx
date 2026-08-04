import { cn } from '@/lib/utils'

/**
 * A solid disc (settled) partially eclipsed by a ring (outstanding) - the
 * literal shape of the product: balances moving from open to settled.
 * Deliberately not a stock icon-in-a-rounded-square.
 */
export function BaakiMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn('text-brand', className)}
      aria-hidden="true"
    >
      <circle cx="13" cy="16" r="10" fill="currentColor" opacity="0.16" />
      <circle cx="13" cy="16" r="9" fill="currentColor" />
      <circle cx="21.5" cy="16" r="6.25" stroke="currentColor" strokeWidth="2.25" />
    </svg>
  )
}
