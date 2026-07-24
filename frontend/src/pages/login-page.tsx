import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Receipt, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { usersApi, getErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { UserResponse } from '@/lib/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [search, setSearch] = useState('')

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.list })

  const filtered = (usersQuery.data ?? []).filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  )

  const handleLogin = (user: UserResponse) => {
    login(user)
    navigate('/groups')
  }

  const registerMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (user) => {
      toast.success(`Welcome, ${user.name}`)
      handleLogin(user)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleRegister = (formData: FormData) => {
    registerMutation.mutate({
      name: String(formData.get('name')),
      email: String(formData.get('email')),
      password: String(formData.get('password')),
    })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Receipt className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Baaki</h1>
          <p className="text-sm text-muted-foreground">Expense settlement, simplified.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Get started</CardTitle>
            <CardDescription>
              Demo mode — sign in as any existing user, no password required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email…"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {usersQuery.isLoading && (
                    <p className="py-4 text-center text-sm text-muted-foreground">Loading users…</p>
                  )}
                  {usersQuery.isSuccess && filtered.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No users found.</p>
                  )}
                  {filtered.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleLogin(user)}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
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
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form
                  className="space-y-3"
                  action={(formData) => handleRegister(formData)}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="Ada Lovelace" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="ada@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required minLength={8} />
                  </div>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
