import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, LogOut, Users } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { groupsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const groupsQuery = useQuery({
    queryKey: ['groups', currentUser?.id],
    queryFn: () => groupsApi.list(currentUser!.id),
    enabled: open && !!currentUser,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  const go = (path: string) => {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a page or group…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/')}>
            <LayoutDashboard /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/groups')}>
            <Users /> All groups
          </CommandItem>
        </CommandGroup>
        {groupsQuery.data && groupsQuery.data.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Groups">
              {groupsQuery.data.map((group) => (
                <CommandItem key={group.id} onSelect={() => go(`/groups/${group.id}`)}>
                  <Users /> {group.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => {
              logout()
              go('/login')
            }}
          >
            <LogOut /> Log out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
