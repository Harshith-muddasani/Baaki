import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { avatarGradient } from '@/lib/avatar-color'
import { fadeInUp } from '@/lib/motion'

interface GroupCardProps {
  id: number
  name: string
  subtitle: ReactNode
  trailing?: ReactNode
  index?: number
}

export function GroupCard({ id, name, subtitle, trailing, index = 0 }: GroupCardProps) {
  return (
    <motion.div {...fadeInUp(index)}>
      <Link
        to={`/groups/${id}`}
        className="group flex items-center gap-3 rounded-xl bg-card p-3 border border-border/40 shadow-premium transition-all duration-200 hover:shadow-lg hover:border-brand/20 hover:bg-muted/20"
      >
        <div
          className="relative overflow-hidden flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
          style={{ background: avatarGradient(id) }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 pointer-events-none" />
          <span className="relative z-10">{name.slice(0, 1).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {trailing}
          <ChevronRight className="size-3.5 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
      </Link>
    </motion.div>
  )
}
