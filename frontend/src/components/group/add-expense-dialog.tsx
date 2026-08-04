import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserAvatar } from '@/components/user-avatar'
import { groupMembersApi, expensesApi, getErrorMessage } from '@/lib/api'
import { rupeesToMinorUnits } from '@/lib/format'
import { useAuth } from '@/lib/auth-context'
import { CATEGORIES, detectCategory, type ExpenseCategory } from '@/lib/category'
import { CategoryBadge } from '@/components/category-badge'
import { cn } from '@/lib/utils'
import type { CreateExpenseRequest, SplitType } from '@/lib/types'

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: 'EQUAL', label: 'Equal' },
  { value: 'EXACT', label: 'Exact' },
  { value: 'PERCENTAGE', label: 'Percent' },
  { value: 'SHARES', label: 'Shares' },
]

export function AddExpenseDialog({ groupId }: { groupId: number }) {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('OTHER')
  const [paidByUserId, setPaidByUserId] = useState<string>('')
  const [splitType, setSplitType] = useState<SplitType>('EQUAL')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [values, setValues] = useState<Record<number, string>>({})

  const membersQuery = useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: () => groupMembersApi.list(groupId),
    enabled: open,
  })

  const reset = () => {
    setDescription('')
    setCategory('OTHER')
    setPaidByUserId('')
    setSplitType('EQUAL')
    setSelected(new Set())
    setValues({})
  }

  const handleDescriptionChange = (text: string) => {
    setDescription(text)
    const detected = detectCategory(text)
    if (detected !== 'OTHER') {
      setCategory(detected)
    }
  }

  const createExpense = useMutation({
    mutationFn: (body: CreateExpenseRequest & { category?: ExpenseCategory }) => expensesApi.create(groupId, body),
    onSuccess: () => {
      toast.success('Expense added successfully')
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'balances'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'suggestions'] })
      setOpen(false)
      reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const toggleParticipant = (userId: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(userId)
      else next.delete(userId)
      return next
    })
  }

  const handleSubmit = (formData: FormData) => {
    const participants = [...selected].map((userId) => ({
      userId,
      amount: splitType === 'EXACT' ? rupeesToMinorUnits(Number(values[userId] || 0)) : null,
      percentage: splitType === 'PERCENTAGE' ? Number(values[userId] || 0) : null,
      shares: splitType === 'SHARES' ? Number(values[userId] || 0) : null,
    }))

    createExpense.mutate({
      paidByUserId: Number(paidByUserId),
      description,
      category,
      totalAmount: rupeesToMinorUnits(Number(formData.get('totalAmount'))),
      currency: 'INR',
      splitType,
      participants,
      createdByUserId: currentUser!.id,
    })
  }

  const participantSum = [...selected].reduce((sum, id) => sum + Number(values[id] || 0), 0)
  const targetSum = splitType === 'PERCENTAGE' ? 100 : null
  const sumIsOff = targetSum !== null && selected.size > 0 && Math.abs(participantSum - targetSum) > 0.01

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className="font-semibold shadow-sm hover:shadow-md shadow-brand/10 hover:shadow-brand/20 rounded-xl px-3.5 h-8">
            <Plus className="size-4 mr-0.5" /> Add expense
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg rounded-2xl border border-border/40 bg-card shadow-2xl">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-brand" /> Add an expense
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto py-4 pr-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-semibold text-foreground/80">Description</Label>
                {category !== 'OTHER' && <CategoryBadge category={category} size="sm" />}
              </div>
              <Input
                id="description"
                name="description"
                required
                placeholder="e.g. Dinner at Cafe, Uber ride"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Category</Label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORIES) as ExpenseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'transition-all duration-200',
                      category === cat ? 'ring-2 ring-brand ring-offset-1 dark:ring-offset-card' : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    <CategoryBadge category={cat} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="totalAmount" className="text-xs font-semibold text-foreground/80">Amount</Label>
                <InputGroup className="rounded-xl overflow-hidden">
                  <InputGroupAddon className="bg-muted/50 font-bold">₹</InputGroupAddon>
                  <InputGroupInput
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="h-10 font-semibold text-foreground"
                    required
                  />
                </InputGroup>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Paid by</Label>
                <Select
                  value={paidByUserId}
                  onValueChange={(value) => setPaidByUserId(value ?? '')}
                  required
                >
                  <SelectTrigger className="w-full h-10 rounded-xl">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {membersQuery.data?.map((m) => (
                      <SelectItem key={m.userId} value={String(m.userId)}>
                        <span className="flex items-center gap-2">
                          <UserAvatar name={m.userName} seed={m.userId} size="sm" />
                          <span className="font-semibold text-xs">{m.userName}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Split Mode</Label>
              <ToggleGroup
                value={[splitType]}
                onValueChange={(v) => {
                  const next = v[0] as SplitType | undefined
                  if (!next) return
                  setSplitType(next)
                  setValues({})
                }}
                variant="outline"
                className="w-full bg-muted/30 p-1 border border-border/30 rounded-xl"
              >
                {SPLIT_TYPES.map((t) => (
                  <ToggleGroupItem key={t.value} value={t.value} className="flex-1 rounded-lg py-1 text-xs font-semibold">
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground/80">Split between</Label>
                {targetSum !== null && selected.size > 0 && (
                  <span className={cn('text-xs font-semibold', sumIsOff ? 'text-negative' : 'text-positive')}>
                    {participantSum}% of 100%
                  </span>
                )}
              </div>
              <div className="space-y-1 rounded-xl border border-border/40 p-2 bg-muted/10">
                {membersQuery.data?.map((m) => (
                  <div
                    key={m.userId}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all',
                      selected.has(m.userId) ? 'bg-brand-soft/50 dark:bg-brand-soft/20 border border-brand/20' : 'hover:bg-muted/40',
                    )}
                  >
                    <Checkbox
                      id={`participant-${m.userId}`}
                      checked={selected.has(m.userId)}
                      onCheckedChange={(checked) => toggleParticipant(m.userId, checked === true)}
                    />
                    <UserAvatar name={m.userName} seed={m.userId} size="sm" />
                    <Label htmlFor={`participant-${m.userId}`} className="flex-1 font-semibold text-xs cursor-pointer">
                      {m.userName}
                    </Label>
                    {splitType !== 'EQUAL' && selected.has(m.userId) && (
                      <Input
                        type="number"
                        className="h-8 w-24 rounded-lg text-xs font-semibold"
                        step={splitType === 'SHARES' ? '1' : '0.01'}
                        min="0"
                        placeholder={
                          splitType === 'EXACT' ? '₹' : splitType === 'PERCENTAGE' ? '%' : 'shares'
                        }
                        value={values[m.userId] ?? ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [m.userId]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full font-semibold h-10 rounded-xl shadow-md shadow-brand/20"
              disabled={createExpense.isPending || !paidByUserId || selected.size === 0 || !description}
            >
              {createExpense.isPending ? 'Adding expense…' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
