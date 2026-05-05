'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Receipt, CreditCard, Banknote, Info, Pencil, X, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Category, CashExpense, CreditExpense } from '@/lib/types'
import { CARD_TYPES } from '@/lib/types'

interface ExpenseListProps {
  cashExpenses: CashExpense[]
  creditExpenses?: CreditExpense[]
  categories: Category[]
  onDeleteCash?: (id: string) => void
  onDeleteCredit?: (id: string) => void
  onUpdateCash?: (id: string, updates: Partial<Omit<CashExpense, 'id'>>) => void
  onUpdateCredit?: (id: string, updates: Partial<Omit<CreditExpense, 'id'>>) => void
  showCredit?: boolean
  title: string
}

function formatDateDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

function getCardLabel(cardType: string): string {
  return CARD_TYPES.find(c => c.value === cardType)?.label || cardType
}

const formatARS = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ExpenseList({
  cashExpenses, creditExpenses = [], categories,
  onDeleteCash, onDeleteCredit, onUpdateCash, onUpdateCredit, showCredit = false, title,
}: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ date: string; concept: string; total: string; categoryId: string; paymentType: 'efectivo' | 'debito' } | null>(null)
  const [editCreditId, setEditCreditId] = useState<string | null>(null)
  const [editCreditValues, setEditCreditValues] = useState<{ concept: string; categoryId: string } | null>(null)

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sin categoría'
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#9ca3af'

  const cashTotal = cashExpenses.reduce((s, e) => s + e.total, 0)
  const creditTotal = creditExpenses.reduce((s, e) => s + e.installmentAmount, 0)

  const startEdit = (exp: CashExpense) => {
    setEditingId(exp.id)
    setEditValues({ date: exp.date, concept: exp.concept, total: String(exp.total), categoryId: exp.categoryId, paymentType: exp.paymentType })
  }

  const saveEdit = (id: string) => {
    if (!editValues || !onUpdateCash) return
    onUpdateCash(id, { date: editValues.date, concept: editValues.concept, total: parseFloat(editValues.total), categoryId: editValues.categoryId, paymentType: editValues.paymentType })
    setEditingId(null)
    setEditValues(null)
  }

  const cancelEdit = () => { setEditingId(null); setEditValues(null) }

  const startCreditEdit = (exp: CreditExpense) => {
    setEditCreditId(exp.id)
    setEditCreditValues({ concept: exp.concept, categoryId: exp.categoryId })
  }

  const saveCreditEdit = (id: string) => {
    if (!editCreditValues || !onUpdateCredit) return
    onUpdateCredit(id, { concept: editCreditValues.concept, categoryId: editCreditValues.categoryId })
    setEditCreditId(null)
    setEditCreditValues(null)
  }

  const cancelCreditEdit = () => { setEditCreditId(null); setEditCreditValues(null) }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">Total: ${formatARS(cashTotal + creditTotal)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cashExpenses.length === 0 && creditExpenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay gastos registrados</p>
        ) : (
          <div className="space-y-2">
            <TooltipProvider>
              {cashExpenses.map((expense) => (
                <div key={expense.id} className="rounded-xl border bg-card p-3">
                  {editingId === expense.id && editValues ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Fecha</Label>
                          <Input type="date" value={editValues.date} onChange={e => setEditValues({...editValues, date: e.target.value})} />
                        </div>
                        <div>
                          <Label className="text-xs">Monto</Label>
                          <Input type="number" value={editValues.total} onChange={e => setEditValues({...editValues, total: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Concepto</Label>
                        <Input value={editValues.concept} onChange={e => setEditValues({...editValues, concept: e.target.value})} />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Categoría</Label>
                          <Select value={editValues.categoryId} onValueChange={v => setEditValues({...editValues, categoryId: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                    {cat.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Tipo de pago</Label>
                          <Select value={editValues.paymentType} onValueChange={v => setEditValues({...editValues, paymentType: v as 'efectivo' | 'debito'})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="debito">Débito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(expense.id)}><Check className="h-4 w-4 mr-1" />Guardar</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-lg ${expense.paymentType === 'efectivo' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {expense.paymentType === 'efectivo' ? <Banknote className="h-4 w-4 text-green-600" /> : <Receipt className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(expense.categoryId) }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{expense.concept}</p>
                            {expense.detail && (
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" /></TooltipTrigger>
                                <TooltipContent className="max-w-xs"><p>{expense.detail}</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateDisplay(expense.date)} | {getCategoryName(expense.categoryId)} | {expense.paymentType === 'efectivo' ? 'Efectivo' : 'Débito'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="font-semibold">${formatARS(expense.total)}</span>
                        {onUpdateCash && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(expense)}><Pencil className="h-4 w-4" /></Button>
                        )}
                        {onDeleteCash && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteCash(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showCredit && creditExpenses.map((expense) => (
                <div key={expense.id} className={`rounded-xl border p-3 transition-colors ${expense.isLastInstallment ? 'bg-[#FFF9C4] border-yellow-300' : 'bg-card'}`}>
                  {editCreditId === expense.id && editCreditValues ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Concepto</Label>
                        <Input value={editCreditValues.concept} onChange={e => setEditCreditValues({...editCreditValues, concept: e.target.value})} />
                      </div>
                      <div>
                        <Label className="text-xs">Categoría</Label>
                        <Select value={editCreditValues.categoryId} onValueChange={v => setEditCreditValues({...editCreditValues, categoryId: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveCreditEdit(expense.id)}><Check className="h-4 w-4 mr-1" />Guardar</Button>
                        <Button size="sm" variant="outline" onClick={cancelCreditEdit}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-purple-100"><CreditCard className="h-4 w-4 text-purple-600" /></div>
                        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(expense.categoryId) }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{expense.concept}</p>
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">Cuota {expense.currentInstallment}/{expense.installments}</span>
                            {expense.detail && (
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" /></TooltipTrigger>
                                <TooltipContent className="max-w-xs"><p>{expense.detail}</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateDisplay(expense.date)} | {getCategoryName(expense.categoryId)} | {getCardLabel(expense.cardType)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="font-semibold">${formatARS(expense.installmentAmount)}</span>
                        {onUpdateCredit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startCreditEdit(expense)}><Pencil className="h-4 w-4" /></Button>
                        )}
                        {onDeleteCredit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteCredit(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
