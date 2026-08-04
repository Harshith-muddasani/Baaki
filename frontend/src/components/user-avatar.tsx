import { avatarGradient, initialsOf } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-11 text-sm',
} as const

export function UserAvatar({
  name,
  seed,
  size = 'md',
  className,
}: {
  name: string
  seed: string | number
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        SIZES[size],
        className,
      )}
      style={{ background: avatarGradient(seed) }}
    >
      {initialsOf(name)}
    </div>
  )
}
