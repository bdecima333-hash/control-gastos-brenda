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

  // Group by purchase (parentId or own id), show one row per purchase
  const purchases = useMemo(() => {
    const map = new Map<string, {
      concept: string
      cardType: CardType
      categoryId: string
      installmentAmount: number
      installments: number
      currentInstallment: number
      remainingCount: number
      totalRemaining: number
      nextDate: string
    }>()

    creditExpenses.forEach(exp => {
      const [y, m] = exp.date.split('-').map(Number)
      const year = y
      const month = m - 1
      const isFuture = year > currentYear || (year === currentYear && month >= currentMonth)
      if (!isFuture) return

      const groupKey = exp.parentId || exp.id

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          concept: exp.concept,
          cardType: exp.cardType,
          categoryId: exp.categoryId,
          installmentAmount: exp.installmentAmount,
          installments: exp.installments,
          currentInstallment: exp.currentInstallment,
          remainingCount: 0,
          totalRemaining: 0,
          nextDate: exp.date,
        })
      }
      const entry = map.get(groupKey)!
      entry.remainingCount++
      entry.totalRemaining += exp.installmentAmount
      // track earliest future installment
      if (exp.currentInstallment < entry.currentInstallment) {
        entry.currentInstallment = exp.currentInstallment
        entry.nextDate = exp.date
      }
      // if this is the current month, prioritize it
      if (year === currentYear && month === currentMonth) {
        entry.currentInstallment = exp.currentInstallment
        entry.nextDate = exp.date
      }
    })

    return Array.from(map.values()).sort((a, b) => a.nextDate.localeCompare(b.nextDate))
  }, [creditExpenses, currentYear, currentMonth])

  // Monthly total
  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>()
    creditExpenses.forEach(exp => {
      const [y, m] = exp.date.split('-').map(Number)
      const year = y; const month = m - 1
      if (year < currentYear || (year === currentYear && month < currentMonth)) return
      const key = `${year}-${month}`
      map.set(key, (map.get(key) || 0) + exp.installmentAmount)
    })
    return Array.from(map.entries())
      .map(([k, total]) => { const [y, m] = k.split('-').map(Number); return { year: y, month: m, total } })
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  }, [creditExpenses, currentYear, currentMonth])

  if (purchases.length === 0) {
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
    <div className="space-y-4">
      {/* Summary per purchase */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Compras en cuotas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {purchases.map((p, i) => {
            const cat = categories.find(c => c.id === p.categoryId)
            return (
              <div key={i} className="rounded-xl border bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {cat && <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />}
                    <p className="font-medium truncate">{p.concept}</p>
                  </div>
                  <span className="text-sm font-semibold ml-2 flex-shrink-0">${formatARS(p.installmentAmount)}/mes</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{getCardLabel(p.cardType)} · cuota {p.currentInstallment}/{p.installments} · {p.remainingCount} restantes</span>
                  <span className="font-medium text-foreground">Total: ${formatARS(p.totalRemaining)}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((p.currentInstallment - 1) / p.installments) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Monthly totals */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Total por mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthlyTotals.map(({ year, month, total }) => (
            <div key={`${year}-${month}`} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">{MONTH_NAMES[month]} {year}</span>
              <span className="font-bold text-primary">${formatARS(total)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
