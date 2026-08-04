import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Search, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import { UserAvatar } from '@/components/user-avatar'
import { BaakiMark } from '@/components/baaki-mark'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationCenter } from '@/components/notification-center'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/groups', label: 'Groups', icon: Users, exact: false },
]

export function AppLayout() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <BaakiMark className="size-6 text-brand" />
            <span className="font-bold tracking-tight text-foreground text-base">Baaki</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const active = item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={active}
                        render={
                          <Link to={item.to} className="font-semibold text-xs">
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2.5 px-2 py-2 border-t border-border/30">
            {currentUser && (
              <UserAvatar name={currentUser.name} seed={currentUser.id} size="sm" className="ring-1 ring-border/30 shadow-sm" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-bold text-foreground">{currentUser?.name}</span>
              <span className="truncate text-[10px] text-muted-foreground">{currentUser?.email}</span>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={handleLogout} title="Log out" aria-label="Log out" className="text-muted-foreground hover:text-destructive">
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hover:bg-muted/60 transition-colors" />
            <Separator orientation="vertical" className="h-5 opacity-60" />
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2.5 rounded-full border border-border/30 bg-muted/20 hover:bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:border-brand/30 hover:shadow-premium min-w-48 sm:min-w-64"
            >
              <Search className="size-3.5 text-muted-foreground/80" />
              <span className="font-medium">Search…</span>
              <kbd className="ml-auto rounded-full border border-border/40 bg-muted/80 px-2 py-0.5 font-mono text-[9px] font-semibold">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </SidebarInset>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  )
}
