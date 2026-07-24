import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {membersQuery.data?.length ?? 0} member{membersQuery.data?.length === 1 ? '' : 's'}
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button size="sm" variant="outline">
                  <Plus /> Add member
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email…"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {candidates.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => addMember.mutate(user.id)}
                      disabled={addMember.isPending}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                  {usersQuery.isSuccess && candidates.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No matching users.
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="divide-y">
          {membersQuery.data?.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 py-2.5">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {member.userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{member.userName}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
