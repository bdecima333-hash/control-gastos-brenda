'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Receipt, CreditCard, Banknote, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Category, CashExpense, CreditExpense } from '@/lib/types'
import { CARD_TYPES } from '@/lib/types'

interface ExpenseListProps {
  cashExpenses: CashExpense[]
  creditExpenses?: CreditExpense[]
  categories: Category[]
  onDeleteCash?: (id: string) => void
  onDeleteCredit?: (id: string) => void
  showCredit?: boolean
  title: string
}

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function getCardLabel(cardType: string): string {
  const card = CARD_TYPES.find(c => c.value === cardType)
  return card?.label || cardType
}

const formatARS = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ExpenseList({
  cashExpenses,
  creditExpenses = [],
  categories,
  onDeleteCash,
  onDeleteCredit,
  showCredit = false,
  title,
}: ExpenseListProps) {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || 'Sin categoría'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color || '#9ca3af'
  }

  const cashTotal = cashExpenses.reduce((sum, exp) => sum + exp.total, 0)
  const creditTotal = creditExpenses.reduce((sum, exp) => sum + exp.installmentAmount, 0)

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: ${formatARS((cashTotal + creditTotal))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cashExpenses.length === 0 && creditExpenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay gastos registrados
          </p>
        ) : (
          <div className="space-y-2">
            <TooltipProvider>
              {cashExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg ${expense.paymentType === 'efectivo' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {expense.paymentType === 'efectivo' ? (
                        <Banknote className="h-4 w-4 text-green-600" />
                      ) : (
                        <Receipt className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{expense.concept}</p>
                        {expense.detail && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{expense.detail}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateDisplay(expense.date)} | {getCategoryName(expense.categoryId)} | {expense.paymentType === 'efectivo' ? 'Efectivo' : 'Débito'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="font-semibold">${formatARS(expense.total)}</span>
                    {onDeleteCash && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteCash(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {showCredit &&
                creditExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      expense.isLastInstallment 
                        ? 'bg-[#FFF9C4] border-yellow-300 hover:bg-yellow-100' 
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-purple-100">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                      </div>
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{expense.concept}</p>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
                            Cuota {expense.currentInstallment}/{expense.installments}
                          </span>
                          {expense.detail && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{expense.detail}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateDisplay(expense.date)} | {getCategoryName(expense.categoryId)} | {getCardLabel(expense.cardType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-semibold">${formatARS(expense.installmentAmount)}</span>
                      {onDeleteCredit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteCredit(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
