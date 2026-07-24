import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { groupMembersApi, expensesApi, getErrorMessage } from '@/lib/api'
import { rupeesToMinorUnits } from '@/lib/format'
import { useAuth } from '@/lib/auth-context'
import type { CreateExpenseRequest, SplitType } from '@/lib/types'

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: 'EQUAL', label: 'Equally' },
  { value: 'EXACT', label: 'Exact amounts' },
  { value: 'PERCENTAGE', label: 'Percentages' },
  { value: 'SHARES', label: 'Shares' },
]

export function AddExpenseDialog({ groupId }: { groupId: number }) {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
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
    setPaidByUserId('')
    setSplitType('EQUAL')
    setSelected(new Set())
    setValues({})
  }

  const createExpense = useMutation({
    mutationFn: (body: CreateExpenseRequest) => expensesApi.create(groupId, body),
    onSuccess: () => {
      toast.success('Expense added')
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
      description: String(formData.get('description')),
      totalAmount: rupeesToMinorUnits(Number(formData.get('totalAmount'))),
      currency: 'INR',
      splitType,
      participants,
      createdByUserId: currentUser!.id,
    })
  }

  const participantSum = [...selected].reduce((sum, id) => sum + Number(values[id] || 0), 0)

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
          <Button size="sm">
            <Plus /> Add expense
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add an expense</DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required placeholder="Dinner at Cafe" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="totalAmount">Amount (₹)</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Paid by</Label>
                <Select
                  value={paidByUserId}
                  onValueChange={(value) => setPaidByUserId(value ?? '')}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {membersQuery.data?.map((m) => (
                      <SelectItem key={m.userId} value={String(m.userId)}>
                        {m.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Split</Label>
              <Select
                value={splitType}
                onValueChange={(v) => {
                  setSplitType(v as SplitType)
                  setValues({})
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPLIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Split between</Label>
                {splitType === 'EXACT' && (
                  <span className="text-xs text-muted-foreground">Sum: ₹{participantSum.toFixed(2)}</span>
                )}
                {splitType === 'PERCENTAGE' && (
                  <span className="text-xs text-muted-foreground">Sum: {participantSum}%</span>
                )}
              </div>
              <div className="space-y-1 rounded-md border p-2">
                {membersQuery.data?.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 py-1">
                    <Checkbox
                      id={`participant-${m.userId}`}
                      checked={selected.has(m.userId)}
                      onCheckedChange={(checked) => toggleParticipant(m.userId, checked === true)}
                    />
                    <Label htmlFor={`participant-${m.userId}`} className="flex-1 font-normal">
                      {m.userName}
                    </Label>
                    {splitType !== 'EQUAL' && selected.has(m.userId) && (
                      <Input
                        type="number"
                        className="h-8 w-24"
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
              disabled={createExpense.isPending || !paidByUserId || selected.size === 0}
            >
              {createExpense.isPending ? 'Adding…' : 'Add expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
