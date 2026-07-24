import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { groupsApi, getErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export function GroupsPage() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: groupsApi.list })

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">Shared expenses across your groups.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus /> New group
              </Button>
            }
          />
          <DialogContent>
            <form
              action={(formData) => createGroup.mutate(String(formData.get('name')))}
            >
              <DialogHeader>
                <DialogTitle>Create a group</DialogTitle>
                <DialogDescription>
                  You'll be added as a member automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-4">
                <Label htmlFor="group-name">Group name</Label>
                <Input id="group-name" name="name" required placeholder="Goa Trip" autoFocus />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createGroup.isPending}>
                  {createGroup.isPending ? 'Creating…' : 'Create group'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groupsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {groupsQuery.isSuccess && groupsQuery.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Users className="size-8" />
            <p>No groups yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groupsQuery.data?.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-muted-foreground" />
                  {group.name}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
