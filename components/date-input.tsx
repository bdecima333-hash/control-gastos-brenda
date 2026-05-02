'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface DateInputProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  required?: boolean
}

export function DateInput({ value, onChange, required }: DateInputProps) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-')
      setDay(d || '')
      setMonth(m || '')
      setYear(y || '')
    }
  }, [])

  const update = (d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`)
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder="DD"
        min={1} max={31}
        value={day}
        onChange={(e) => {
          const v = e.target.value.padStart(2, '0').slice(-2)
          setDay(v)
          update(v, month, year)
        }}
        className="w-20 text-center"
        required={required}
      />
      <Input
        type="number"
        placeholder="MM"
        min={1} max={12}
        value={month}
        onChange={(e) => {
          const v = e.target.value.padStart(2, '0').slice(-2)
          setMonth(v)
          update(day, v, year)
        }}
        className="w-20 text-center"
        required={required}
      />
      <Input
        type="number"
        placeholder="AAAA"
        min={2020} max={2099}
        value={year}
        onChange={(e) => {
          setYear(e.target.value)
          update(day, month, e.target.value)
        }}
        className="w-28 text-center"
        required={required}
      />
    </div>
  )
}
