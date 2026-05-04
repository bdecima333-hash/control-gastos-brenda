'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import type { Category, CashExpense, CreditExpense, Income } from '@/lib/types'

interface DashboardProps {
  categories: Category[]
  getExpensesByMonth: (year: number, month: number) => {
    cashExpenses: CashExpense[]
    creditExpenses: CreditExpense[]
    incomes: Income[]
  }
  getAvailableMonths: () => { year: number; month: number }[]
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const formatARS = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function Dashboard({ categories, getExpensesByMonth, getAvailableMonths }: DashboardProps) {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  const availableMonths = useMemo(() => getAvailableMonths(), [getAvailableMonths])

  const data = useMemo(() => getExpensesByMonth(selectedYear, selectedMonth), [getExpensesByMonth, selectedYear, selectedMonth])

  const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0)
  const totalCash = data.cashExpenses.reduce((s, e) => s + e.total, 0)
  const totalCredit = data.creditExpenses.reduce((s, e) => s + e.installmentAmount, 0)
  const totalExpenses = totalCash + totalCredit
  const balance = totalIncome - totalExpenses

  // Group expenses by category
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; value: number }>()

    data.cashExpenses.forEach(exp => {
      const cat = categories.find(c => c.id === exp.categoryId)
      if (!cat) return
      if (!map.has(cat.id)) map.set(cat.id, { name: cat.name, color: cat.color, value: 0 })
      map.get(cat.id)!.value += exp.total
    })

    data.creditExpenses.forEach(exp => {
      const cat = categories.find(c => c.id === exp.categoryId)
      if (!cat) return
      if (!map.has(cat.id)) map.set(cat.id, { name: cat.name, color: cat.color, value: 0 })
      map.get(cat.id)!.value += exp.installmentAmount
    })

    return Array.from(map.values()).sort((a, b) => b.value - a.value)
  }, [data, categories])

  const monthOptions = useMemo(() => {
    const opts: { year: number; month: number }[] = []
    const n = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1)
      opts.push({ year: d.getFullYear(), month: d.getMonth() })
    }
    return opts
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    const pct = totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(1) : '0'
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold">{d.name}</p>
        <p className="text-muted-foreground">${formatARS(d.value)} ({pct}%)</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <Card className="shadow-md">
        <CardContent className="pt-4">
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={`${selectedYear}-${selectedMonth}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-').map(Number)
              setSelectedYear(y)
              setSelectedMonth(m)
            }}
          >
            {monthOptions.map(({ year, month }) => (
              <option key={`${year}-${month}`} value={`${year}-${month}`}>
                {MONTH_NAMES[month]} {year}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="text-xl font-bold text-green-600">${formatARS(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-100"><TrendingDown className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos efectivo/débito</p>
                <p className="text-xl font-bold text-red-500">${formatARS(totalCash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100"><CreditCard className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos tarjeta</p>
                <p className="text-xl font-bold text-purple-600">${formatARS(totalCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Wallet className={`h-5 w-5 ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>${formatARS(balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin gastos este mes</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detalle por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin gastos este mes</p>
            ) : (
              <div className="space-y-2">
                {categoryData.map((cat, i) => {
                  const pct = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-muted-foreground text-xs">{pct.toFixed(1)}%</span>
                          <span className="font-medium">${formatARS(cat.value)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
