import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AppSidebarContent } from '@/components/app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationCenter } from '@/components/notification-center'

export function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 border-r border-border/40 bg-card md:flex">
        <AppSidebarContent />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>App navigation menu</SheetDescription>
          </SheetHeader>
          <AppSidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/60 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex min-w-48 items-center gap-2.5 rounded-full border border-border/30 bg-muted/20 px-3.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:border-brand/30 hover:bg-muted/40 hover:shadow-premium sm:min-w-64"
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
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
