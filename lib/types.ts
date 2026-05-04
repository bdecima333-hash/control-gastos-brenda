export interface Category {
  id: string
  name: string
  color: string
}

export type PaymentType = 'efectivo' | 'debito' | 'tarjeta'

export type CardType = 'visa_5581' | 'amex_4423' | 'visa_ext_5599' | 'amex_ext_4431'

export const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'visa_5581', label: 'Visa (5581)' },
  { value: 'amex_4423', label: 'Amex (4423)' },
  { value: 'visa_ext_5599', label: 'Visa ext (5599)' },
  { value: 'amex_ext_4431', label: 'Amex ext (4431)' },
]

export interface CashExpense {
  id: string
  date: string
  categoryId: string
  concept: string
  detail?: string
  total: number
  paymentType: 'efectivo' | 'debito'
}

export interface CreditExpense {
  id: string
  date: string
  categoryId: string
  concept: string
  detail?: string
  installments: number
  currentInstallment: number
  installmentAmount: number
  totalCost: number
  cardType: CardType
  parentId?: string // Links installments to original purchase
  isLastInstallment?: boolean
}

export interface Income {
  id: string
  date: string
  amount: number
  type: 'efectivo' | 'debito'
  concept: string
}

export type TabType = 'ingresos' | 'gastos' | 'tarjeta' | 'categorias' | 'dashboard' | 'historial'
