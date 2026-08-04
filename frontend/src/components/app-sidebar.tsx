import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { BaakiMark } from '@/components/baaki-mark'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/groups', label: 'Groups', icon: Users, exact: false },
]

/**
 * The sidebar's actual content, shared between the permanent desktop rail
 * and the mobile drawer - one definition so the two can't drift apart.
 */
export function AppSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <BaakiMark className="size-6 text-brand" />
        <span className="text-base font-bold tracking-tight text-foreground">Baaki</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-soft text-brand'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-border/40 px-3 py-3">
        {currentUser && <UserAvatar name={currentUser.name} seed={currentUser.id} size="sm" />}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-semibold text-foreground">{currentUser?.name}</span>
          <span className="truncate text-[11px] text-muted-foreground">{currentUser?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
