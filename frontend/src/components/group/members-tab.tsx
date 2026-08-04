import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/user-avatar'
import { groupMembersApi, usersApi, getErrorMessage } from '@/lib/api'

export function MembersTab({ groupId }: { groupId: number }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const membersQuery = useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: () => groupMembersApi.list(groupId),
  })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.list, enabled: open })

  const addMember = useMutation({
    mutationFn: (userId: number) => groupMembersApi.add(groupId, userId),
    onSuccess: () => {
      toast.success('Member added')
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'members'] })
      setOpen(false)
      setSearch('')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const memberIds = new Set((membersQuery.data ?? []).map((m) => m.userId))
  const candidates = (usersQuery.data ?? [])
    .filter((u) => !memberIds.has(u.id))
    .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 shadow-premium space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Members</span>
          <span className="rounded-full bg-brand-soft text-brand px-2 py-0.5 text-[11px] font-semibold tabular-nums">
            {membersQuery.data?.length ?? 0}
          </span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm" variant="outline" className="font-semibold rounded-lg h-7.5 shadow-sm border border-border/50">
                <Plus className="size-3.5 mr-0.5" /> Add member
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md rounded-2xl border border-border/40 bg-card shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Add a member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="relative">
                <Search className="absolute top-3 left-3 size-4 text-muted-foreground/80" />
                <Input
                  placeholder="Search by name or email…"
                  className="pl-9 h-10 rounded-xl border-border/50 focus:border-brand/40"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {candidates.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => addMember.mutate(user.id)}
                    disabled={addMember.isPending}
                    className="group flex w-full items-center gap-3 rounded-xl p-2 text-left border border-transparent hover:border-brand/10 transition-all duration-200 hover:bg-brand-soft disabled:opacity-50"
                  >
                    <UserAvatar name={user.name} seed={user.id} className="shadow-sm ring-1 ring-border/20" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground/90 group-hover:text-brand transition-colors">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground/80">{user.email}</p>
                    </div>
                  </button>
                ))}
                {usersQuery.isSuccess && candidates.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground font-medium">
                    No matching users.
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {membersQuery.data?.map((member) => (
          <div key={member.userId} className="flex items-center gap-2 rounded-lg p-2 bg-muted/10 hover:bg-muted/20 transition-colors">
            <UserAvatar name={member.userName} seed={member.userId} size="sm" className="shadow-sm" />
            <span className="truncate text-sm font-medium text-foreground/90">{member.userName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
