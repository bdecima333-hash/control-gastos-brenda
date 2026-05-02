'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download, FileSpreadsheet } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import type { Category, CashExpense, CreditExpense, Income } from '@/lib/types'
import { CARD_TYPES } from '@/lib/types'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  cashExpenses: CashExpense[]
  creditExpenses: CreditExpense[]
  getExpensesByMonth: (year: number, month: number) => {
    cashExpenses: CashExpense[]
    creditExpenses: CreditExpense[]
    incomes: Income[]
  }
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

export function ExportDialog({
  open,
  onOpenChange,
  categories,
  getExpensesByMonth,
}: ExportDialogProps) {
  const [exportMode, setExportMode] = useState<'current' | 'range'>('current')
  const currentDate = new Date()
  const [startMonth, setStartMonth] = useState(`${currentDate.getFullYear()}-${currentDate.getMonth()}`)
  const [endMonth, setEndMonth] = useState(`${currentDate.getFullYear()}-${currentDate.getMonth()}`)

  const monthOptions = useMemo(() => {
    const options: { year: number; month: number }[] = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({ year: date.getFullYear(), month: date.getMonth() })
    }
    
    return options
  }, [])

  const getCategoryName = useCallback((categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || 'Sin categoría'
  }, [categories])

  const getExpensesForExport = useCallback(() => {
    if (exportMode === 'current') {
      return getExpensesByMonth(currentDate.getFullYear(), currentDate.getMonth())
    }

    const [startYear, startMonthNum] = startMonth.split('-').map(Number)
    const [endYear, endMonthNum] = endMonth.split('-').map(Number)

    const allCash: CashExpense[] = []
    const allCredit: CreditExpense[] = []

    let current = new Date(startYear, startMonthNum, 1)
    const end = new Date(endYear, endMonthNum, 1)

    while (current <= end) {
      const { cashExpenses: cash, creditExpenses: credit } = getExpensesByMonth(
        current.getFullYear(),
        current.getMonth()
      )
      allCash.push(...cash)
      allCredit.push(...credit)
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    }

    return { cashExpenses: allCash, creditExpenses: allCredit }
  }, [exportMode, startMonth, endMonth, currentDate, getExpensesByMonth])

  const handleExport = () => {
    const { cashExpenses: cash, creditExpenses: credit } = getExpensesForExport()

    // Prepare cash expenses data
    const cashData = cash.map((exp) => ({
      Fecha: formatDateDisplay(exp.date),
      Categoría: getCategoryName(exp.categoryId),
      Concepto: exp.concept,
      Detalle: exp.detail || '',
      'Tipo de pago': exp.paymentType === 'efectivo' ? 'Efectivo' : 'Débito',
      Total: exp.total,
    }))

    // Prepare credit expenses data
    const creditData = credit.map((exp) => ({
      Fecha: formatDateDisplay(exp.date),
      Categoría: getCategoryName(exp.categoryId),
      Concepto: exp.concept,
      Detalle: exp.detail || '',
      Tarjeta: getCardLabel(exp.cardType),
      Cuota: `${exp.currentInstallment}/${exp.installments}`,
      'Monto cuota': exp.installmentAmount,
      'Costo total': exp.totalCost,
    }))

    // Create workbook with two sheets
    const wb = XLSX.utils.book_new()

    const cashSheet = XLSX.utils.json_to_sheet(cashData)
    XLSX.utils.book_append_sheet(wb, cashSheet, 'Débito-Efectivo')

    const creditSheet = XLSX.utils.json_to_sheet(creditData)
    XLSX.utils.book_append_sheet(wb, creditSheet, 'Tarjeta de Crédito')

    // Generate filename
    let filename: string
    if (exportMode === 'current') {
      filename = `Gastos_${MONTH_NAMES[currentDate.getMonth()]}_${currentDate.getFullYear()}.xlsx`
    } else {
      const [sy, sm] = startMonth.split('-').map(Number)
      const [ey, em] = endMonth.split('-').map(Number)
      filename = `Gastos_${MONTH_NAMES[sm]}_${sy}_a_${MONTH_NAMES[em]}_${ey}.xlsx`
    }

    // Download file
    XLSX.writeFile(wb, filename)
    onOpenChange(false)
  }

  const previewData = useMemo(() => getExpensesForExport(), [getExpensesForExport])
  const cashTotal = previewData.cashExpenses.reduce((sum, exp) => sum + exp.total, 0)
  const creditTotal = previewData.creditExpenses.reduce((sum, exp) => sum + exp.installmentAmount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar a Excel
          </DialogTitle>
          <DialogDescription>
            Exporta tus gastos a un archivo .xlsx con dos hojas: Débito/Efectivo y Tarjeta de crédito
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>Modo de exportación</Label>
            <RadioGroup value={exportMode} onValueChange={(v) => setExportMode(v as 'current' | 'range')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="font-normal cursor-pointer">
                  Mes actual ({MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="font-normal cursor-pointer">
                  Rango de meses
                </Label>
              </div>
            </RadioGroup>
          </div>

          {exportMode === 'range' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes inicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(({ year, month }) => (
                      <SelectItem key={`start-${year}-${month}`} value={`${year}-${month}`}>
                        {MONTH_NAMES[month]} {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Select value={endMonth} onValueChange={setEndMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes fin" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(({ year, month }) => (
                      <SelectItem key={`end-${year}-${month}`} value={`${year}-${month}`}>
                        {MONTH_NAMES[month]} {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Vista previa del export:</p>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="text-muted-foreground">Gastos efectivo/débito:</span>{' '}
                <span className="font-medium">{previewData.cashExpenses.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gastos tarjeta:</span>{' '}
                <span className="font-medium">{previewData.creditExpenses.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">${formatARS((cashTotal + creditTotal))}</span>
              </div>
            </div>
          </div>

          <Button onClick={handleExport} className="w-full" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
