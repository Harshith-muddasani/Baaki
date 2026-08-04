import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { BaakiMark } from '@/components/baaki-mark'
import { usersApi, getErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { fadeIn } from '@/lib/motion'
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
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-[#07060b] lg:flex lg:flex-col lg:justify-between lg:p-12 border-r border-white/5">
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 size-[350px] rounded-full bg-brand/8 blur-[80px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 size-[280px] rounded-full bg-positive/8 blur-[90px] animate-float pointer-events-none" style={{ animationDelay: '-3s' }} />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative flex items-center gap-2">
          <BaakiMark className="size-7 text-brand" />
          <span className="text-lg font-bold tracking-tight text-white">Baaki</span>
        </div>

        <div className="relative max-w-sm space-y-5">
          <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-white">
            Every rupee, <br /> accounted for.
          </h1>
          <p className="text-sm leading-relaxed text-white/40">
            Split expenses across groups, watch balances settle in real time, and
            never wonder who owes what.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Real-time splits', 'Smart categories', 'Instant settle'].map((f) => (
              <span key={f} className="rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-[11px] font-medium text-white/50">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Demo settlement card */}
        <motion.div
          {...fadeIn(0.15, 12)}
          className="relative w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.3)] animate-float"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              <UserAvatar name="Priya Sharma" seed="priya-demo" size="sm" className="ring-2 ring-[#07060b]" />
              <UserAvatar name="Raj Malhotra" seed="raj-demo" size="sm" className="ring-2 ring-[#07060b]" />
            </div>
            <span className="rounded-full bg-positive/20 px-2 py-0.5 text-[10px] font-semibold text-positive uppercase tracking-wide">
              Settled
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5 text-white">
            <span className="text-2xl font-bold tabular-nums tracking-tight">₹2,450.00</span>
          </div>
          <p className="mt-1 text-[11px] text-white/35 font-medium">Priya paid Raj · Goa Trip</p>
        </motion.div>
      </div>

      {/* Right auth form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex items-center gap-2 lg:hidden">
            <BaakiMark className="size-6 text-brand" />
            <span className="text-lg font-bold tracking-tight text-foreground">Baaki</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-brand" />
              <p className="text-[11px] font-semibold tracking-widest text-brand uppercase">Welcome</p>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Sign in to continue</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Demo mode — pick any existing user, no password required.
            </p>
          </div>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="w-full p-1 bg-muted/30 border border-border/30 rounded-lg">
              <TabsTrigger value="signin" className="rounded-md py-1 text-xs font-semibold">Sign in</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md py-1 text-xs font-semibold">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground/70" />
                <Input
                  placeholder="Search by name or email…"
                  className="pl-8 h-9 rounded-lg text-xs border-border/50 focus:border-brand/40"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-64 space-y-0.5 overflow-y-auto">
                {usersQuery.isLoading && (
                  <p className="py-6 text-center text-xs text-muted-foreground">Loading users…</p>
                )}
                {usersQuery.isSuccess && filtered.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No users found.</p>
                )}
                {filtered.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleLogin(user)}
                    className="group flex w-full items-center gap-2.5 rounded-lg p-2 text-left border border-transparent hover:border-brand/10 transition-all duration-150 hover:bg-brand-soft/60"
                  >
                    <UserAvatar name={user.name} seed={user.id} size="sm" className="ring-1 ring-border/20" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground group-hover:text-brand transition-colors">{user.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground/70">{user.email}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-brand -translate-x-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form className="space-y-3" action={(formData) => handleRegister(formData)}>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-[11px] font-semibold text-foreground/70">Name</Label>
                  <Input id="name" name="name" required placeholder="Ada Lovelace" className="h-9 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[11px] font-semibold text-foreground/70">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="ada@example.com" className="h-9 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-[11px] font-semibold text-foreground/70">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} className="h-9 rounded-lg text-xs" />
                </div>
                <Button type="submit" className="w-full h-9 rounded-lg text-xs font-semibold mt-1" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
