import { getCategoryMeta, type ExpenseCategory } from '@/lib/category'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category?: ExpenseCategory | string | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CategoryBadge({
  category,
  showLabel = true,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        meta.bgClass,
        meta.textClass,
        meta.borderClass,
        sizeClasses[size],
        className,
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  )
}
