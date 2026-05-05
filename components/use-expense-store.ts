'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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
  { id: '9', name: 'Gasto hormiga', color: '#6b7280' },
  { id: '10', name: 'Otros', color: '#6b7280' },
]

export function useExpenseStore() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [cashExpenses, setCashExpenses] = useState<CashExpense[]>([])
  const [creditExpenses, setCreditExpenses] = useState<CreditExpense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  // Load all data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [{ data: cats }, { data: cash }, { data: credit }, { data: inc }] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('cash_expenses').select('*'),
        supabase.from('credit_expenses').select('*'),
        supabase.from('incomes').select('*'),
      ])

      if (cats && cats.length > 0) setCategories(cats.map(r => ({ id: r.id, name: r.name, color: r.color })))
      if (cash) setCashExpenses(cash.map(r => ({
        id: r.id, date: r.date, categoryId: r.category_id, concept: r.concept,
        detail: r.detail, total: r.total, paymentType: r.type as 'efectivo' | 'debito'
      })))
      if (credit) setCreditExpenses(credit.map(r => ({
        id: r.id, date: r.date, categoryId: r.category_id, concept: r.concept,
        detail: r.detail, installments: r.installments, currentInstallment: r.current_installment,
        installmentAmount: r.installment_amount, totalCost: r.total_cost,
        cardType: r.card_type as CardType, parentId: r.parent_id, isLastInstallment: r.is_last_installment
      })))
      if (inc) setIncomes(inc.map(r => ({ id: r.id, date: r.date, amount: r.amount, type: r.type as 'efectivo' | 'debito', concept: r.concept, amountUsd: r.amount_usd ?? undefined, exchangeRate: r.exchange_rate ?? undefined })))
      setLoading(false)
    }
    loadData()
  }, [])

  const calculateBalances = () => {
    let efectivoBalance = 0
    let debitoBalance = 0
    incomes.forEach((income) => {
      if (income.type === 'efectivo') efectivoBalance += income.amount
      else debitoBalance += income.amount
    })
    cashExpenses.forEach((expense) => {
      if (expense.paymentType === 'efectivo') efectivoBalance -= expense.total
      else debitoBalance -= expense.total
    })
    return { efectivoBalance, debitoBalance }
  }

  // Category CRUD
  const addCategory = async (category: Omit<Category, 'id'>) => {
    const id = crypto.randomUUID()
    const newCat = { ...category, id }
    await supabase.from('categories').insert({ id, name: category.name, color: category.color })
    setCategories(prev => [...prev, newCat])
  }

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    await supabase.from('categories').update(updates).eq('id', id)
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat))
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }

  // Income CRUD
  const addIncome = async (income: Omit<Income, 'id'>) => {
    const id = crypto.randomUUID()
    const newIncome = { ...income, id }
    await supabase.from('incomes').insert({ id, date: income.date, amount: income.amount, type: income.type, concept: income.concept, amount_usd: income.amountUsd ?? null, exchange_rate: income.exchangeRate ?? null })
    setIncomes(prev => [...prev, newIncome])
  }

  const deleteIncome = async (id: string) => {
    await supabase.from('incomes').delete().eq('id', id)
    setIncomes(prev => prev.filter(inc => inc.id !== id))
  }

  const updateIncome = async (id: string, updates: Partial<Omit<Income, 'id'>>) => {
    await supabase.from('incomes').update(updates).eq('id', id)
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, ...updates } : inc))
  }

  // Cash Expense CRUD
  const addCashExpense = async (expense: Omit<CashExpense, 'id'>) => {
    const id = crypto.randomUUID()
    const newExp = { ...expense, id }
    await supabase.from('cash_expenses').insert({
      id, date: expense.date, amount: expense.total, total: expense.total,
      type: expense.paymentType, concept: expense.concept,
      category_id: expense.categoryId, detail: expense.detail
    })
    setCashExpenses(prev => [...prev, newExp])
  }

  const updateCashExpense = async (id: string, updates: Partial<Omit<CashExpense, 'id'>>) => {
    await supabase.from('cash_expenses').update({
      date: updates.date, total: updates.total, type: updates.paymentType,
      concept: updates.concept, category_id: updates.categoryId
    }).eq('id', id)
    setCashExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp))
  }

  const deleteCashExpense = async (id: string) => {
    await supabase.from('cash_expenses').delete().eq('id', id)
    setCashExpenses(prev => prev.filter(exp => exp.id !== id))
  }

  // Credit Expense CRUD
  const addCreditExpense = async (expense: {
    date: string; categoryId: string; concept: string; detail?: string
    installments: number; installmentAmount: number; totalCost: number; cardType: CardType; currentInstallment?: number
  }) => {
    const parentId = crypto.randomUUID()
    const startDate = new Date(expense.date + 'T12:00:00')
    const newExpenses: CreditExpense[] = []
    const rows = []
    const startInstallment = (expense.currentInstallment || 1) - 1
    const remainingInstallments = expense.installments - startInstallment

    for (let i = 0; i < remainingInstallments; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
      const dateStr = d.toISOString().split('T')[0]
      const id = i === 0 ? parentId : crypto.randomUUID()
      const exp: CreditExpense = {
        id, date: dateStr, categoryId: expense.categoryId, concept: expense.concept,
        detail: expense.detail, installments: expense.installments, currentInstallment: i + 1,
        installmentAmount: expense.installmentAmount, totalCost: expense.totalCost,
        cardType: expense.cardType, parentId: i === 0 ? undefined : parentId,
        isLastInstallment: startInstallment + i + 1 === expense.installments
      }
      newExpenses.push(exp)
      rows.push({
        id, date: dateStr, category_id: expense.categoryId, concept: expense.concept,
        detail: expense.detail, installments: expense.installments, current_installment: startInstallment + i + 1,
        installment_amount: expense.installmentAmount, total_cost: expense.totalCost,
        card_type: expense.cardType, parent_id: i === 0 ? null : parentId,
        is_last_installment: startInstallment + i + 1 === expense.installments, amount: expense.installmentAmount
      })
    }

    const { error } = await supabase.from('credit_expenses').insert(rows)
    if (error) { console.error('credit insert error:', error); return }
    setCreditExpenses(prev => [...prev, ...newExpenses])
  }

  const updateCreditExpense = async (id: string, updates: Partial<Omit<CreditExpense, 'id'>>) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.concept !== undefined) dbUpdates.concept = updates.concept
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.installmentAmount !== undefined) dbUpdates.installment_amount = updates.installmentAmount
    if (updates.cardType !== undefined) dbUpdates.card_type = updates.cardType
    await supabase.from('credit_expenses').update(dbUpdates).eq('id', id)
    setCreditExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp))
  }

  const deleteCreditExpense = async (id: string) => {
    const expense = creditExpenses.find(exp => exp.id === id)
    if (!expense) return
    if (!expense.parentId) {
      await supabase.from('credit_expenses').delete().or(`id.eq.${id},parent_id.eq.${id}`)
      setCreditExpenses(prev => prev.filter(exp => exp.id !== id && exp.parentId !== id))
    } else {
      await supabase.from('credit_expenses').delete().or(`id.eq.${expense.parentId},parent_id.eq.${expense.parentId},id.eq.${id}`)
      setCreditExpenses(prev => prev.filter(exp => exp.id !== expense.parentId && exp.parentId !== expense.parentId && exp.id !== id))
    }
  }

  const deleteSingleInstallment = async (id: string) => {
    await supabase.from('credit_expenses').delete().eq('id', id)
    setCreditExpenses(prev => prev.filter(exp => exp.id !== id))
  }

  const getCategoryById = (id: string) => categories.find(cat => cat.id === id)

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return { year, month: month - 1, day }
  }

  const getExpensesByMonth = useCallback((year: number, month: number) => {
    const filteredCash = cashExpenses.filter(exp => { const d = parseLocalDate(exp.date); return d.year === year && d.month === month })
    const filteredCredit = creditExpenses.filter(exp => { const d = parseLocalDate(exp.date); return d.year === year && d.month === month })
    const filteredIncomes = incomes.filter(inc => { const d = parseLocalDate(inc.date); return d.year === year && d.month === month })
    return { cashExpenses: filteredCash, creditExpenses: filteredCredit, incomes: filteredIncomes }
  }, [cashExpenses, creditExpenses, incomes])

  const getAvailableMonths = useCallback(() => {
    const months = new Set<string>()
    cashExpenses.forEach(exp => { const d = parseLocalDate(exp.date); months.add(`${d.year}-${d.month}`) })
    creditExpenses.forEach(exp => { const d = parseLocalDate(exp.date); months.add(`${d.year}-${d.month}`) })
    incomes.forEach(inc => { const d = parseLocalDate(inc.date); months.add(`${d.year}-${d.month}`) })
    return Array.from(months).map(m => { const [y, mo] = m.split('-').map(Number); return { year: y, month: mo } })
      .sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  }, [cashExpenses, creditExpenses, incomes])

  return {
    categories, cashExpenses, creditExpenses, incomes, loading,
    calculateBalances, addCategory, updateCategory, deleteCategory,
    addIncome, deleteIncome, updateIncome,
    addCashExpense, updateCashExpense, deleteCashExpense,
    addCreditExpense, updateCreditExpense, deleteCreditExpense,
    deleteSingleInstallment, getCategoryById, getExpensesByMonth, getAvailableMonths,
  }
}
