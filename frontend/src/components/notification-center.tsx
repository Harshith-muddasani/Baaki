import { useState } from 'react'
import { Bell, CheckCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotificationItem {
  id: string
  title: string
  subtitle: string
  time: string
  unread: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Priya Sharma settled a balance',
    subtitle: 'Paid ₹2,450.00 to Raj Malhotra · Goa Trip',
    time: '10m ago',
    unread: true,
  },
  {
    id: '2',
    title: 'New expense added in Goa Trip',
    subtitle: 'Raj Malhotra added "Dinner at Cafe" for ₹1,800.00',
    time: '2h ago',
    unread: true,
  },
  {
    id: '3',
    title: 'Ada Lovelace joined Weekend Getaway',
    subtitle: 'Added as a new group member',
    time: '1d ago',
    unread: false,
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-md p-2 shadow-xl">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="flex items-center gap-1.5 p-0 text-sm font-bold text-foreground">
            <Sparkles className="size-4 text-brand" /> Activity Feed
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
            >
              <CheckCheck className="size-3" /> Mark read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-1 bg-border/40" />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 rounded-xl p-2.5 transition-colors cursor-pointer ${
                n.unread ? 'bg-brand-soft/40 dark:bg-brand-soft/20' : 'hover:bg-muted/40'
              }`}
            >
              <div className="flex w-full items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{n.title}</span>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{n.subtitle}</p>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
