'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Plus } from 'lucide-react'
import type { Category, CardType } from '@/lib/types'
import { CARD_TYPES } from '@/lib/types'

interface CreditExpenseFormProps {
  categories: Category[]
  onSubmit: (expense: {
    date: string
    categoryId: string
    concept: string
    detail?: string
    installments: number
    installmentAmount: number
    totalCost: number
    cardType: CardType
    currentInstallment?: number
  }) => void
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const formatARS = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CreditExpenseForm({ categories, onSubmit }: CreditExpenseFormProps) {
  const [date, setDate] = useState(formatDateForInput(new Date()))
  const [categoryId, setCategoryId] = useState('')
  const [concept, setConcept] = useState('')
  const [detail, setDetail] = useState('')
  const [installments, setInstallments] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [cardType, setCardType] = useState<CardType | ''>('')
  const [currentInstallment, setCurrentInstallment] = useState('1')

  // Calculate total from cuotas and monto por cuota
  const calculatedTotal = installments && installmentAmount 
    ? formatARS(parseInt(installments) * parseFloat(installmentAmount))
    : '0.00'

  const handleInstallmentsChange = (value: string) => {
    setInstallments(value)
  }

  const handleInstallmentAmountChange = (value: string) => {
    setInstallmentAmount(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('submit', {categoryId, concept, installments, installmentAmount, cardType, currentInstallment})
    if (!categoryId || !concept || !installments || !installmentAmount || !cardType) { console.log('validation failed'); return }

    const inst = parseInt(installments)
    const amount = parseFloat(installmentAmount)

    onSubmit({
      date,
      categoryId,
      concept,
      detail: detail || undefined,
      installments: inst,
      installmentAmount: amount,
      totalCost: inst * amount,
      cardType,
      currentInstallment: parseInt(currentInstallment) || 1,
    })

    setConcept('')
    setDetail('')
    setInstallments('')
    setInstallmentAmount('')
    setCardType('')
    setCurrentInstallment('1')
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Nuevo gasto con tarjeta de crédito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cc-date">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              
            </div>

            <div className="space-y-2">
              <Label htmlFor="cc-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cc-card">Tipo de tarjeta</Label>
              <Select value={cardType} onValueChange={(v) => setCardType(v as CardType)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {CARD_TYPES.map((card) => (
                    <SelectItem key={card.value} value={card.value}>
                      {card.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-concept">Concepto</Label>
            <Input
              id="cc-concept"
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Descripción del gasto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-detail">Detalle (opcional)</Label>
            <Textarea
              id="cc-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Información adicional para compras grandes..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="cc-installments">Cuotas</Label>
              <Input
                id="cc-installments"
                type="number"
                min="1"
                step="1"
                value={installments}
                onChange={(e) => handleInstallmentsChange(e.target.value)}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cc-current">Cuota actual</Label>
              <Input
                id="cc-current"
                type="number"
                min="1"
                step="1"
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cc-installment-amount">Monto por cuota ($)</Label>
              <Input
                id="cc-installment-amount"
                type="number"
                min="0"
                step="0.01"
                value={installmentAmount}
                onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Total (auto)</Label>
              <div className="h-9 px-3 py-2 rounded-md border bg-muted/50 text-sm font-medium">
                ${calculatedTotal}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Agregar gasto con tarjeta
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
