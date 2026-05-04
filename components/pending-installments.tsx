'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Calendar } from 'lucide-react'
import type { CreditExpense, Category, CardType } from '@/lib/types'
import { CARD_TYPES } from '@/lib/types'

interface PendingInstallmentsProps {
  creditExpenses: CreditExpense[]
  categories: Category[]
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const formatARS = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function getCardLabel(cardType: CardType): string {
  return CARD_TYPES.find(c => c.value === cardType)?.label ?? cardType
}

export function PendingInstallments({ creditExpenses, categories }: PendingInstallmentsProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Group future installments by month
  const monthlyData = useMemo(() => {
    const map = new Map<string, { year: number; month: number; total: number; items: CreditExpense[] }>()

    creditExpenses.forEach(exp => {
      const [y, m] = exp.date.split('-').map(Number)
      const year = y
      const month = m - 1

      // Only include current month and future
      if (year < currentYear || (year === currentYear && month < currentMonth)) return

      const key = `${year}-${month}`
      if (!map.has(key)) map.set(key, { year, month, total: 0, items: [] })
      const entry = map.get(key)!
      entry.total += exp.installmentAmount
      entry.items.push(exp)
    })

    return Array.from(map.values()).sort((a, b) => 
      a.year !== b.year ? a.year - b.year : a.month - b.month
    )
  }, [creditExpenses, currentYear, currentMonth])

  if (monthlyData.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cuotas pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No hay cuotas pendientes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Cuotas pendientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {monthlyData.map(({ year, month, total, items }) => (
          <div key={`${year}-${month}`} className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
              <span className="font-semibold text-sm">{MONTH_NAMES[month]} {year}</span>
              <span className="font-bold text-primary">${formatARS(total)}</span>
            </div>
            <div className="divide-y">
              {items.map(exp => {
                const cat = categories.find(c => c.id === exp.categoryId)
                return (
                  <div key={exp.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {cat && <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{exp.concept}</p>
                        <p className="text-xs text-muted-foreground">{getCardLabel(exp.cardType)} · cuota {exp.currentInstallment}/{exp.installments}</p>
                      </div>
                    </div>
                    <span className="ml-2 flex-shrink-0 font-medium">${formatARS(exp.installmentAmount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
