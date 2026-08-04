import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from 'recharts'
import { CATEGORIES, type ExpenseCategory } from '@/lib/category'
import { formatMoney } from '@/lib/format'
import type { ExpenseResponse } from '@/lib/types'

interface SpendingChartProps {
  expenses: ExpenseResponse[]
  type?: 'donut' | 'area'
}

export function SpendingChart({ expenses, type = 'donut' }: SpendingChartProps) {
  // Aggregate expenses by category
  const categoryData = useMemo(() => {
    const map = new Map<ExpenseCategory, number>()
    for (const exp of expenses) {
      const cat = (exp as ExpenseResponse & { category?: ExpenseCategory }).category || 'OTHER'
      map.set(cat, (map.get(cat) || 0) + exp.totalAmount)
    }
    return Array.from(map.entries()).map(([cat, amount]) => {
      const meta = CATEGORIES[cat]
      return {
        name: meta.label,
        value: amount / 100, // convert paise to rupees for charts
        color: meta.colorHex,
      }
    })
  }, [expenses])

  // Aggregate monthly spending velocity
  const areaData = useMemo(() => {
    const map = new Map<string, number>()
    for (const exp of expenses) {
      const date = new Date(exp.createdAt)
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      map.set(label, (map.get(label) || 0) + exp.totalAmount / 100)
    }
    return Array.from(map.entries())
      .map(([date, amount]) => ({ date, amount }))
      .slice(-7)
  }, [expenses])

  if (expenses.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        No expense data to analyze yet.
      </div>
    )
  }

  if (type === 'area') {
    return (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-border/50 bg-card p-2 shadow-lg text-xs">
                      <span className="font-semibold text-foreground">{payload[0].payload.date}</span>
                      <p className="font-bold text-brand mt-0.5">
                        ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSpend)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]
                  return (
                    <div className="rounded-xl border border-border/50 bg-card p-2 shadow-lg text-xs">
                      <span className="font-semibold text-foreground">{data.name}</span>
                      <p className="font-bold text-brand mt-0.5">
                        {formatMoney(Math.round(Number(data.value) * 100))}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-2 text-xs">
        {categoryData.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted/40 transition-colors">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="truncate text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {formatMoney(Math.round(item.value * 100))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
