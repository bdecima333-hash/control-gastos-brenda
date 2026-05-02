'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ExpenseList } from './expense-list'
import { Calendar, TrendingUp, Receipt, CreditCard, Banknote, Pencil, Trash2, X, Check } from 'lucide-react'
import type { Category, CashExpense, CreditExpense, Income } from '@/lib/types'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface HistoryViewProps {
  categories: Category[]
  getExpensesByMonth: (year: number, month: number) => {
    cashExpenses: CashExpense[]
    creditExpenses: CreditExpense[]
    incomes: Income[]
  }
  getAvailableMonths: () => { year: number; month: number }[]
  onUpdateIncome: (id: string, updates: Partial<Omit<Income, 'id'>>) => void
  onDeleteIncome: (id: string) => void
}

const formatARS = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatDateDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export function HistoryView({ categories, getExpensesByMonth, getAvailableMonths, onUpdateIncome, onDeleteIncome }: HistoryViewProps) {
  const availableMonths = useMemo(() => getAvailableMonths(), [getAvailableMonths])
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ date: string; amount: string; type: 'efectivo' | 'debito'; concept: string } | null>(null)

  const expenses = useMemo(() => getExpensesByMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth, getExpensesByMonth])

  const cashTotal = expenses.cashExpenses.reduce((sum, exp) => sum + exp.total, 0)
  const creditTotal = expenses.creditExpenses.reduce((sum, exp) => sum + exp.installmentAmount, 0)
  const incomesTotal = expenses.incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const grandTotal = cashTotal + creditTotal

  const monthOptions = useMemo(() => {
    const options: { year: number; month: number }[] = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({ year: date.getFullYear(), month: date.getMonth() })
    }
    return options
  }, [])

  const years = useMemo(() => {
    const uniqueYears = [...new Set(monthOptions.map(m => m.year))]
    return uniqueYears.sort((a, b) => b - a)
  }, [monthOptions])

  const isMonthAvailable = (year: number, month: number) =>
    availableMonths.some(m => m.year === year && m.month === month)

  const isSelected = (year: number, month: number) =>
    selectedYear === year && selectedMonth === month

  const startEdit = (income: Income) => {
    setEditingId(income.id)
    setEditValues({ date: income.date, amount: String(income.amount), type: income.type, concept: income.concept })
  }

  const saveEdit = (id: string) => {
    if (!editValues) return
    onUpdateIncome(id, { date: editValues.date, amount: parseFloat(editValues.amount), type: editValues.type, concept: editValues.concept })
    setEditingId(null)
    setEditValues(null)
  }

  const cancelEdit = () => { setEditingId(null); setEditValues(null) }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {years.map((year) => (
            <div key={year} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{year}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                {MONTH_NAMES.map((monthName, monthIndex) => {
                  const isInRange = monthOptions.some(m => m.year === year && m.month === monthIndex)
                  const hasData = isMonthAvailable(year, monthIndex)
                  const selected = isSelected(year, monthIndex)
                  if (!isInRange) return null
                  return (
                    <button
                      key={monthIndex}
                      onClick={() => { setSelectedYear(year); setSelectedMonth(monthIndex) }}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${selected ? 'bg-primary text-primary-foreground shadow-md' : hasData ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                      {monthName.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold text-green-600">${formatARS(incomesTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><Receipt className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Efectivo/débito</p>
                <p className="text-2xl font-bold">${formatARS(cashTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100"><CreditCard className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Tarjeta crédito</p>
                <p className="text-2xl font-bold">${formatARS(creditTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-100"><TrendingUp className="h-5 w-5 text-red-500 rotate-180" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total gastos</p>
                <p className="text-2xl font-bold">${formatARS(grandTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseList cashExpenses={expenses.cashExpenses} categories={categories} title={`Efectivo/débito - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`} />
        <ExpenseList cashExpenses={[]} creditExpenses={expenses.creditExpenses} categories={categories} showCredit title={`Tarjeta crédito - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`} />
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Ingresos - {MONTH_NAMES[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.incomes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay ingresos este mes</p>
          ) : (
            <div className="space-y-2">
              {expenses.incomes.map((income) => (
                <div key={income.id} className="rounded-xl border bg-card p-3">
                  {editingId === income.id && editValues ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input type="date" value={editValues.date} onChange={(e) => setEditValues({ ...editValues, date: e.target.value })} />
                        <Input type="number" min="0" step="0.01" value={editValues.amount} onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })} />
                      </div>
                      <Input type="text" value={editValues.concept} onChange={(e) => setEditValues({ ...editValues, concept: e.target.value })} />
                      <RadioGroup value={editValues.type} onValueChange={(v) => setEditValues({ ...editValues, type: v as 'efectivo' | 'debito' })} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="efectivo" id={`h-ef-${income.id}`} /><Label htmlFor={`h-ef-${income.id}`} className="font-normal">Efectivo</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="debito" id={`h-db-${income.id}`} /><Label htmlFor={`h-db-${income.id}`} className="font-normal">Débito</Label></div>
                      </RadioGroup>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(income.id)}><Check className="h-4 w-4 mr-1" />Guardar</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-lg ${income.type === 'efectivo' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {income.type === 'efectivo' ? <Banknote className="h-4 w-4 text-green-600" /> : <CreditCard className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{income.concept}</p>
                          <p className="text-xs text-muted-foreground">{formatDateDisplay(income.date)} | {income.type === 'efectivo' ? 'Efectivo' : 'Débito'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="font-semibold text-green-600">+${formatARS(income.amount)}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(income)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteIncome(income.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
