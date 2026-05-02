'use client'

import { useState } from 'react'
import { DateInput } from './date-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, TrendingUp, Trash2, Banknote, CreditCard, Pencil, X, Check } from 'lucide-react'
import type { Income } from '@/lib/types'

interface IncomeFormProps {
  incomes: Income[]
  onSubmit: (income: { date: string; amount: number; type: 'efectivo' | 'debito'; concept: string }) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Omit<Income, 'id'>>) => void
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

export function IncomeForm({ incomes, onSubmit, onDelete, onUpdate }: IncomeFormProps) {
  const [date, setDate] = useState(formatDateForInput(new Date()))
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'efectivo' | 'debito'>('debito')
  const [concept, setConcept] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ date: string; amount: string; type: 'efectivo' | 'debito'; concept: string } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !concept) return
    onSubmit({ date, amount: parseFloat(amount), type, concept })
    setAmount('')
    setConcept('')
  }

  const startEdit = (income: Income) => {
    setEditingId(income.id)
    setEditValues({ date: income.date, amount: String(income.amount), type: income.type, concept: income.concept })
  }

  const saveEdit = (id: string) => {
    if (!editValues) return
    onUpdate(id, { date: editValues.date, amount: parseFloat(editValues.amount), type: editValues.type, concept: editValues.concept })
    setEditingId(null)
    setEditValues(null)
  }

  const cancelEdit = () => { setEditingId(null); setEditValues(null) }

  const currentDate = new Date()
  const currentMonthIncomes = incomes.filter((inc) => {
    const [y, m] = inc.date.split('-').map(Number)
    return y === currentDate.getFullYear() && m - 1 === currentDate.getMonth()
  })

  const totalEfectivo = currentMonthIncomes.filter((inc) => inc.type === 'efectivo').reduce((sum, inc) => sum + inc.amount, 0)
  const totalDebito = currentMonthIncomes.filter((inc) => inc.type === 'debito').reduce((sum, inc) => sum + inc.amount, 0)

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
                <DateInput value={date} onChange={setDate} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-amount">Monto ($)</Label>
                <Input id="income-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-concept">Concepto</Label>
              <Input id="income-concept" type="text" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Sueldo, Freelance, etc." required />
            </div>
            <div className="space-y-2">
              <Label>Tipo de ingreso</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as 'efectivo' | 'debito')} className="flex gap-4 pt-2">
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
              <div className="p-2 rounded-xl bg-green-100"><Banknote className="h-5 w-5 text-green-600" /></div>
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
              <div className="p-2 rounded-xl bg-blue-100"><CreditCard className="h-5 w-5 text-blue-600" /></div>
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
            <p className="text-center text-muted-foreground py-8">No hay ingresos registrados este mes</p>
          ) : (
            <div className="space-y-2">
              {currentMonthIncomes.map((income) => (
                <div key={income.id} className="rounded-xl border bg-card p-3">
                  {editingId === income.id && editValues ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <DateInput value={date} onChange={setDate} required />
                        <Input type="number" min="0" step="0.01" value={editValues.amount} onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })} />
                      </div>
                      <Input type="text" value={editValues.concept} onChange={(e) => setEditValues({ ...editValues, concept: e.target.value })} />
                      <RadioGroup value={editValues.type} onValueChange={(v) => setEditValues({ ...editValues, type: v as 'efectivo' | 'debito' })} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="efectivo" id={`edit-ef-${income.id}`} /><Label htmlFor={`edit-ef-${income.id}`} className="font-normal">Efectivo</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="debito" id={`edit-db-${income.id}`} /><Label htmlFor={`edit-db-${income.id}`} className="font-normal">Débito</Label></div>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(income.id)}><Trash2 className="h-4 w-4" /></Button>
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
