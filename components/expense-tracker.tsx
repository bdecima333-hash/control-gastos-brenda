'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CashExpenseForm } from './cash-expense-form'
import { CreditExpenseForm } from './credit-expense-form'
import { IncomeForm } from './income-form'
import { ExpenseList } from './expense-list'
import { CategoryManager } from './category-manager'
import { HistoryView } from './history-view'
import { ExportDialog } from './export-dialog'
import { useExpenseStore } from '@/hooks/use-expense-store'
import { Receipt, CreditCard, Tags, Calendar, Download, Wallet, TrendingUp, Banknote } from 'lucide-react'
import { formatARS } from '@/lib/utils'
import type { TabType } from '@/lib/types'

export function ExpenseTracker() {
  const [activeTab, setActiveTab] = useState<TabType>('ingresos')
  const [exportOpen, setExportOpen] = useState(false)
  const store = useExpenseStore()

  const currentDate = new Date()
  const currentMonthExpenses = useMemo(
    () => store.getExpensesByMonth(currentDate.getFullYear(), currentDate.getMonth()),
    [store, currentDate]
  )

  const balances = useMemo(() => store.calculateBalances(), [store])

  const cashTotal = currentMonthExpenses.cashExpenses.reduce((sum, exp) => sum + exp.total, 0)
  const creditTotal = currentMonthExpenses.creditExpenses.reduce((sum, exp) => sum + exp.installmentAmount, 0)

  const showBalanceCards = activeTab !== 'historial'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Control de gastos</h1>
                <p className="text-sm text-muted-foreground">Gestiona tus finanzas personales</p>
              </div>
            </div>
            <Button onClick={() => setExportOpen(true)} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Balance Dashboard - only show on non-historial tabs */}
      {showBalanceCards && (
        <div className="container mx-auto px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-100">
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo efectivo</p>
                    <p className={`text-xl font-bold ${balances.efectivoBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ${formatARS(balances.efectivoBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo débito</p>
                    <p className={`text-xl font-bold ${balances.debitoBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      ${formatARS(balances.debitoBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gastos del mes</p>
                    <p className="text-xl font-bold">${formatARS(cashTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-100">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tarjeta del mes</p>
                    <p className="text-xl font-bold">${formatARS(creditTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 pb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto shadow-md">
            <TabsTrigger value="ingresos" className="flex flex-col sm:flex-row gap-1 py-2.5">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Ingresos</span>
            </TabsTrigger>
            <TabsTrigger value="gastos" className="flex flex-col sm:flex-row gap-1 py-2.5">
              <Receipt className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Gastos</span>
            </TabsTrigger>
            <TabsTrigger value="tarjeta" className="flex flex-col sm:flex-row gap-1 py-2.5">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Tarjeta</span>
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex flex-col sm:flex-row gap-1 py-2.5">
              <Tags className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex flex-col sm:flex-row gap-1 py-2.5">
              <Calendar className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Historial</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingresos" className="space-y-6">
            <IncomeForm
              incomes={store.incomes}
              onSubmit={store.addIncome}
              onDelete={store.deleteIncome}
            />
          </TabsContent>

          <TabsContent value="gastos" className="space-y-6">
            <CashExpenseForm
              categories={store.categories}
              onSubmit={store.addCashExpense}
            />
            <ExpenseList
              cashExpenses={currentMonthExpenses.cashExpenses}
              categories={store.categories}
              onDeleteCash={store.deleteCashExpense}
              title="Gastos del mes (efectivo/débito)"
            />
          </TabsContent>

          <TabsContent value="tarjeta" className="space-y-6">
            <CreditExpenseForm
              categories={store.categories}
              onSubmit={store.addCreditExpense}
            />
            <ExpenseList
              cashExpenses={[]}
              creditExpenses={currentMonthExpenses.creditExpenses}
              categories={store.categories}
              onDeleteCredit={store.deleteCreditExpense}
              showCredit
              title="Gastos del mes (tarjeta de crédito)"
            />
          </TabsContent>

          <TabsContent value="categorias">
            <CategoryManager
              categories={store.categories}
              onAdd={store.addCategory}
              onUpdate={store.updateCategory}
              onDelete={store.deleteCategory}
            />
          </TabsContent>

          <TabsContent value="historial">
            <HistoryView
              categories={store.categories}
              getExpensesByMonth={store.getExpensesByMonth}
              getAvailableMonths={store.getAvailableMonths}
            />
          </TabsContent>
        </Tabs>
      </main>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        categories={store.categories}
        cashExpenses={store.cashExpenses}
        creditExpenses={store.creditExpenses}
        getExpensesByMonth={store.getExpensesByMonth}
      />

      <footer className="border-t py-4 mt-8 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Todos los datos se guardan localmente en tu navegador</p>
        </div>
      </footer>
    </div>
  )
}
