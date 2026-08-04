import {
  Utensils,
  Plane,
  Home,
  Film,
  ShoppingBag,
  Zap,
  Gift,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'

export type ExpenseCategory =
  | 'FOOD'
  | 'TRAVEL'
  | 'HOUSING'
  | 'ENTERTAINMENT'
  | 'SHOPPING'
  | 'BILLS'
  | 'GIFTS'
  | 'OTHER'

export interface CategoryMeta {
  id: ExpenseCategory
  label: string
  icon: LucideIcon
  colorHex: string
  bgClass: string
  textClass: string
  borderClass: string
}

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  FOOD: {
    id: 'FOOD',
    label: 'Food & Drinks',
    icon: Utensils,
    colorHex: '#f59e0b',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  TRAVEL: {
    id: 'TRAVEL',
    label: 'Travel & Trips',
    icon: Plane,
    colorHex: '#3b82f6',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/20',
  },
  HOUSING: {
    id: 'HOUSING',
    label: 'Housing & Rent',
    icon: Home,
    colorHex: '#8b5cf6',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/20',
  },
  ENTERTAINMENT: {
    id: 'ENTERTAINMENT',
    label: 'Entertainment',
    icon: Film,
    colorHex: '#ec4899',
    bgClass: 'bg-pink-500/10 dark:bg-pink-500/20',
    textClass: 'text-pink-600 dark:text-pink-400',
    borderClass: 'border-pink-500/20',
  },
  SHOPPING: {
    id: 'SHOPPING',
    label: 'Shopping',
    icon: ShoppingBag,
    colorHex: '#10b981',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  BILLS: {
    id: 'BILLS',
    label: 'Bills & Utilities',
    icon: Zap,
    colorHex: '#06b6d4',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/20',
  },
  GIFTS: {
    id: 'GIFTS',
    label: 'Gifts & Social',
    icon: Gift,
    colorHex: '#f43f5e',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/20',
    textClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-500/20',
  },
  OTHER: {
    id: 'OTHER',
    label: 'General & Misc',
    icon: MoreHorizontal,
    colorHex: '#64748b',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/20',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-500/20',
  },
}

export function getCategoryMeta(category?: string | null): CategoryMeta {
  if (category && category in CATEGORIES) {
    return CATEGORIES[category as ExpenseCategory]
  }
  return CATEGORIES.OTHER
}

/** Auto-detects category from expense description */
export function detectCategory(description: string): ExpenseCategory {
  const text = description.toLowerCase()

  if (/\b(dinner|lunch|breakfast|food|pizza|burger|cafe|coffee|drinks|bar|restaurant|snack|beer|groceries|swiggy|zomato)\b/.test(text)) {
    return 'FOOD'
  }
  if (/\b(flight|uber|ola|cab|taxi|trip|hotel|airbnb|bus|train|ticket|fuel|petrol|goa|resort|travel|toll)\b/.test(text)) {
    return 'TRAVEL'
  }
  if (/\b(rent|deposit|house|apartment|stay|flat|maintenance)\b/.test(text)) {
    return 'HOUSING'
  }
  if (/\b(movie|cinema|netflix|concert|game|show|spotify|club|party|bowling)\b/.test(text)) {
    return 'ENTERTAINMENT'
  }
  if (/\b(shopping|clothes|shoes|amazon|flipkart|mall|store|buy|electronics)\b/.test(text)) {
    return 'SHOPPING'
  }
  if (/\b(wifi|internet|electricity|water|bill|gas|recharge|subscription|tv)\b/.test(text)) {
    return 'BILLS'
  }
  if (/\b(gift|birthday|celebration|present|party|anniversary)\b/.test(text)) {
    return 'GIFTS'
  }

  return 'OTHER'
}
