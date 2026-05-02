'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, TrendingUp, Trash2, Banknote, CreditCard } from 'lucide-react'
import type { Income } from '@/lib/types'

interface IncomeFormProps {
  incomes: Income[]
  onSubmit: (income: {
    date: string
    amount: number
    type: 'efectivo' | 'debito'
    concept: string
  }) => void
  onDelete: (id: string) => void
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function IncomeForm({ incomes, onSubmit, onDelete }: IncomeFormProps) {
  const [date, setDate] = useState(formatDateForInput(new Date()))
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'efectivo' | 'debito'>('debito')
  const [concept, setConcept] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !concept) return

    onSubmit({
      date,
      amount: parseFloat(amount),
      type,
      concept,
    })

    setAmount('')
    setConcept('')
  }

  // Get current month incomes
  const currentDate = new Date()
  const currentMonthIncomes = incomes.filter((inc) => {
    const incDate = new Date(inc.date)
    return (
      incDate.getMonth() === currentDate.getMonth() &&
      incDate.getFullYear() === currentDate.getFullYear()
    )
  })

  const totalEfectivo = currentMonthIncomes
    .filter((inc) => inc.type === 'efectivo')
    .reduce((sum, inc) => sum + inc.amount, 0)

  const totalDebito = currentMonthIncomes
    .filter((inc) => inc.type === 'debito')
    .reduce((sum, inc) => sum + inc.amount, 0)

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar ingreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="income-date">Fecha</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-amount">Monto ($)</Label>
                <Input
                  id="income-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="income-concept">Concepto</Label>
              <Input
                id="income-concept"
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Sueldo, Freelance, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de ingreso</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as 'efectivo' | 'debito')}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="efectivo" id="income-efectivo" />
                  <Label htmlFor="income-efectivo" className="font-normal cursor-pointer">Efectivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debito" id="income-debito" />
                  <Label htmlFor="income-debito" className="font-normal cursor-pointer">Débito</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Agregar ingreso
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos efectivo (este mes)</p>
                <p className="text-2xl font-bold text-green-600">${formatARS(totalEfectivo)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos débito (este mes)</p>
                <p className="text-2xl font-bold text-blue-600">${formatARS(totalDebito)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ingresos del mes ({currentMonthIncomes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthIncomes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay ingresos registrados este mes
            </p>
          ) : (
            <div className="space-y-2">
              {currentMonthIncomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg ${income.type === 'efectivo' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {income.type === 'efectivo' ? (
                        <Banknote className="h-4 w-4 text-green-600" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{income.concept}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateDisplay(income.date)} | {income.type === 'efectivo' ? 'Efectivo' : 'Débito'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="font-semibold text-green-600">+${formatARS(income.amount)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(income.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
