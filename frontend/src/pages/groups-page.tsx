import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupCard } from '@/components/group-card'
import { EmptyState } from '@/components/empty-state'
import { groupsApi, getErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export function GroupsPage() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: groupsApi.list })

  const groups = (groupsQuery.data ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  )

  const createGroup = useMutation({
    mutationFn: (name: string) => groupsApi.create({ name, createdByUserId: currentUser!.id }),
    onSuccess: () => {
      toast.success('Group created')
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-brand uppercase">
            Workspace
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">Groups</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="font-semibold shadow-sm hover:shadow-md shadow-brand/10 rounded-lg h-8 text-xs">
                <Plus className="size-3.5 mr-0.5" /> New group
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md rounded-xl border border-border/40 bg-card shadow-xl">
            <form action={(formData) => createGroup.mutate(String(formData.get('name')))}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">Create a group</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">You'll be added as a member automatically.</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-4">
                <Label htmlFor="group-name" className="text-[11px] font-semibold text-foreground/70">Group name</Label>
                <Input id="group-name" name="name" required placeholder="Goa Trip" autoFocus className="h-9 rounded-lg text-xs" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createGroup.isPending} className="font-semibold h-9 text-xs px-4 rounded-lg">
                  {createGroup.isPending ? 'Creating…' : 'Create group'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground/60" />
        <Input
          placeholder="Search groups…"
          className="pl-8 h-9 rounded-lg text-xs border-border/40"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {groupsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {groupsQuery.isSuccess && groups.length === 0 && (
        <EmptyState
          icon={<Users className="size-7 text-muted-foreground/50" />}
          message={search ? 'No matching groups.' : 'No groups yet. Create one to get started.'}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group, i) => (
          <GroupCard
            key={group.id}
            id={group.id}
            name={group.name}
            index={i}
            subtitle={`Created ${new Date(group.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}`}
          />
        ))}
      </div>
    </div>
  )
}
