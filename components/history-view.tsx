'use client'

import { formatARS } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpenseList } from './expense-list'
import { Calendar, TrendingUp, Receipt, CreditCard } from 'lucide-react'
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
}

export function HistoryView({ categories, getExpensesByMonth, getAvailableMonths }: HistoryViewProps) {
  const availableMonths = useMemo(() => getAvailableMonths(), [getAvailableMonths])
  
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())

  const expenses = useMemo(() => getExpensesByMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth, getExpensesByMonth])

  const cashTotal = expenses.cashExpenses.reduce((sum, exp) => sum + exp.total, 0)
  const creditTotal = expenses.creditExpenses.reduce((sum, exp) => sum + exp.installmentAmount, 0)
  const incomesTotal = expenses.incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const grandTotal = cashTotal + creditTotal

  // Generate list of months (current month + past 24 months)
  const monthOptions = useMemo(() => {
    const options: { year: number; month: number }[] = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({ year: date.getFullYear(), month: date.getMonth() })
    }
    
    return options
  }, [])

  // Group months by year for grid display
  const years = useMemo(() => {
    const uniqueYears = [...new Set(monthOptions.map(m => m.year))]
    return uniqueYears.sort((a, b) => b - a)
  }, [monthOptions])

  const handleMonthSelect = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const isMonthAvailable = (year: number, month: number) => {
    return availableMonths.some(m => m.year === year && m.month === month)
  }

  const isSelected = (year: number, month: number) => {
    return selectedYear === year && selectedMonth === month
  }

  return (
    <div className="space-y-6">
      {/* Month Selector Grid */}
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
                      onClick={() => handleMonthSelect(year, monthIndex)}
                      className={`
                        p-2 rounded-lg text-xs font-medium transition-all
                        ${selected 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : hasData 
                            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }
                      `}
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

      {/* Summary Cards for Selected Month */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
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
              <div className="p-2 rounded-xl bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
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
              <div className="p-2 rounded-xl bg-purple-100">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
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
              <div className="p-2 rounded-xl bg-red-100">
                <TrendingUp className="h-5 w-5 text-red-500 rotate-180" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total gastos</p>
                <p className="text-2xl font-bold">${formatARS(grandTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseList
          cashExpenses={expenses.cashExpenses}
          categories={categories}
          title={`Efectivo/débito - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
        />
        <ExpenseList
          cashExpenses={[]}
          creditExpenses={expenses.creditExpenses}
          categories={categories}
          showCredit
          title={`Tarjeta crédito - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
        />
      </div>
    </div>
  )
}
