'use client'

import { useLocalStorage } from './use-local-storage'
import type { Category, CashExpense, CreditExpense, Income, CardType } from '@/lib/types'

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Hogar y servicios fijos', color: '#3b82f6' },
  { id: '2', name: 'Alimentación e higiene', color: '#22c55e' },
  { id: '3', name: 'Entretenimiento', color: '#a855f7' },
  { id: '4', name: 'Regalos y eventuales', color: '#f97316' },
  { id: '5', name: 'Deportes', color: '#14b8a6' },
  { id: '6', name: 'Belleza', color: '#ec4899' },
  { id: '7', name: 'Transporte', color: '#6366f1' },
  { id: '8', name: 'Salud', color: '#ef4444' },
  { id: '9', name: 'Otros', color: '#6b7280' },
]

export function useExpenseStore() {
  const [categories, setCategories] = useLocalStorage<Category[]>('expense-categories', DEFAULT_CATEGORIES)
  const [cashExpenses, setCashExpenses] = useLocalStorage<CashExpense[]>('cash-expenses', [])
  const [creditExpenses, setCreditExpenses] = useLocalStorage<CreditExpense[]>('credit-expenses', [])
  const [incomes, setIncomes] = useLocalStorage<Income[]>('incomes', [])

  // Calculate balances
  const calculateBalances = () => {
    let efectivoBalance = 0
    let debitoBalance = 0

    // Add incomes
    incomes.forEach((income) => {
      if (income.type === 'efectivo') {
        efectivoBalance += income.amount
      } else {
        debitoBalance += income.amount
      }
    })

    // Subtract expenses (only cash expenses, not credit card)
    cashExpenses.forEach((expense) => {
      if (expense.paymentType === 'efectivo') {
        efectivoBalance -= expense.total
      } else {
        debitoBalance -= expense.total
      }
    })

    return { efectivoBalance, debitoBalance }
  }

  // Category CRUD
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    }
    setCategories((prev) => [...prev, newCategory])
  }

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    )
  }

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
  }

  // Income CRUD
  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
    }
    setIncomes((prev) => [...prev, newIncome])
  }

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((inc) => inc.id !== id))
  }

  const updateIncome = (id: string, updates: Partial<Omit<Income, 'id'>>) => {
    setIncomes((prev) => prev.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc)))
  }

  // Cash Expense CRUD
  const addCashExpense = (expense: Omit<CashExpense, 'id'>) => {
    const newExpense: CashExpense = {
      ...expense,
      id: crypto.randomUUID(),
    }
    setCashExpenses((prev) => [...prev, newExpense])
  }

  const updateCashExpense = (id: string, updates: Partial<Omit<CashExpense, 'id'>>) => {
    setCashExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    )
  }

  const deleteCashExpense = (id: string) => {
    setCashExpenses((prev) => prev.filter((exp) => exp.id !== id))
  }

  // Credit Expense CRUD - with installment generation
  const addCreditExpense = (expense: {
    date: string
    categoryId: string
    concept: string
    detail?: string
    installments: number
    installmentAmount: number
    totalCost: number
    cardType: CardType
  }) => {
    const parentId = crypto.randomUUID()
    const startDate = new Date(expense.date)
    const newExpenses: CreditExpense[] = []

    // Generate an entry for each installment
    for (let i = 0; i < expense.installments; i++) {
      const installmentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
      
      newExpenses.push({
        id: i === 0 ? parentId : crypto.randomUUID(),
        date: installmentDate.toISOString().split('T')[0],
        categoryId: expense.categoryId,
        concept: expense.concept,
        detail: expense.detail,
        installments: expense.installments,
        currentInstallment: i + 1,
        installmentAmount: expense.installmentAmount,
        totalCost: expense.totalCost,
        cardType: expense.cardType,
        parentId: i === 0 ? undefined : parentId,
        isLastInstallment: i === expense.installments - 1,
      })
    }

    setCreditExpenses((prev) => [...prev, ...newExpenses])
  }

  const updateCreditExpense = (id: string, updates: Partial<Omit<CreditExpense, 'id'>>) => {
    setCreditExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    )
  }

  const deleteCreditExpense = (id: string) => {
    // Find the expense to delete
    const expense = creditExpenses.find((exp) => exp.id === id)
    if (!expense) return

    // If this is a parent expense, delete all related installments
    if (!expense.parentId) {
      setCreditExpenses((prev) => prev.filter((exp) => exp.id !== id && exp.parentId !== id))
    } else {
      // If deleting a child, also delete parent and all siblings
      setCreditExpenses((prev) => prev.filter((exp) => 
        exp.id !== expense.parentId && 
        exp.parentId !== expense.parentId &&
        exp.id !== id
      ))
    }
  }

  // Delete single installment (for when last is logged)
  const deleteSingleInstallment = (id: string) => {
    setCreditExpenses((prev) => prev.filter((exp) => exp.id !== id))
  }

  // Utility functions
  const getCategoryById = (id: string) => categories.find((cat) => cat.id === id)


  // Parse YYYY-MM-DD without timezone shift
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return { year, month: month - 1, day }
  }

  const getExpensesByMonth = (year: number, month: number) => {
    const filteredCash = cashExpenses.filter((exp) => {
      const d = parseLocalDate(exp.date)
      return d.year === year && d.month === month
    })

    const filteredCredit = creditExpenses.filter((exp) => {
      const d = parseLocalDate(exp.date)
      return d.year === year && d.month === month
    })

    const filteredIncomes = incomes.filter((inc) => {
      const d = parseLocalDate(inc.date)
      return d.year === year && d.month === month
    })

    return { cashExpenses: filteredCash, creditExpenses: filteredCredit, incomes: filteredIncomes }
  }

  const getAvailableMonths = () => {
    const months = new Set<string>()
    
    cashExpenses.forEach((exp) => {
      const d = parseLocalDate(exp.date)
      months.add(`${d.year}-${d.month}`)
    })
    
    creditExpenses.forEach((exp) => {
      const d = parseLocalDate(exp.date)
      months.add(`${d.year}-${d.month}`)
    })

    incomes.forEach((inc) => {
      const d = parseLocalDate(inc.date)
      months.add(`${d.year}-${d.month}`)
    })

    return Array.from(months)
      .map((m) => {
        const [year, month] = m.split('-').map(Number)
        return { year, month }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }

  return {
    categories,
    cashExpenses,
    creditExpenses,
    incomes,
    calculateBalances,
    addCategory,
    updateCategory,
    deleteCategory,
    addIncome,
    deleteIncome,
    updateIncome,
    addCashExpense,
    updateCashExpense,
    deleteCashExpense,
    addCreditExpense,
    updateCreditExpense,
    deleteCreditExpense,
    deleteSingleInstallment,
    getCategoryById,
    getExpensesByMonth,
    getAvailableMonths,
  }
}
