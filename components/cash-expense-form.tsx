'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus } from 'lucide-react'
import type { Category } from '@/lib/types'

interface CashExpenseFormProps {
  categories: Category[]
  onSubmit: (expense: {
    date: string
    categoryId: string
    concept: string
    detail?: string
    total: number
    paymentType: 'efectivo' | 'debito'
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

export function CashExpenseForm({ categories, onSubmit }: CashExpenseFormProps) {
  const [date, setDate] = useState(formatDateForInput(new Date()))
  const [categoryId, setCategoryId] = useState('')
  const [concept, setConcept] = useState('')
  const [detail, setDetail] = useState('')
  const [total, setTotal] = useState('')
  const [paymentType, setPaymentType] = useState<'efectivo' | 'debito'>('debito')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !concept || !total) return

    onSubmit({
      date,
      categoryId,
      concept,
      detail: detail || undefined,
      total: parseFloat(total),
      paymentType,
    })

    setConcept('')
    setDetail('')
    setTotal('')
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nuevo gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input
              id="concept"
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Descripción del gasto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail">Detalle (opcional)</Label>
            <Textarea
              id="detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Información adicional para compras grandes..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total">Costo total ($)</Label>
              <Input
                id="total"
                type="number"
                min="0"
                step="0.01"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <RadioGroup
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as 'efectivo' | 'debito')}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo" className="font-normal cursor-pointer">Efectivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debito" id="debito" />
                  <Label htmlFor="debito" className="font-normal cursor-pointer">Débito</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Agregar gasto
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
