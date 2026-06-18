import { useEffect, useRef, useState } from 'react'

interface NumericInputProps {
  value?: number
  onChange: (value: number | undefined) => void
  mode?: 'integer' | 'decimal'
  min?: number
  max?: number
  fallback?: number
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

const formatValue = (value: number | undefined) => (value === undefined || Number.isNaN(value) ? '' : String(value))

export default function NumericInput({
  value,
  onChange,
  mode = 'integer',
  min,
  max,
  fallback,
  placeholder,
  disabled,
  className,
  ariaLabel,
}: NumericInputProps) {
  const [text, setText] = useState(() => formatValue(value))
  const focused = useRef(false)
  const selectOnFirstTap = useRef(true)

  useEffect(() => {
    if (!focused.current) setText(formatValue(value))
  }, [value])

  const normalize = (raw: string) => raw.replace(',', '.')

  const parse = (raw: string) => {
    const parsed = Number(normalize(raw))
    if (!Number.isFinite(parsed)) return undefined
    const boundedMin = min === undefined ? parsed : Math.max(min, parsed)
    return max === undefined ? boundedMin : Math.min(max, boundedMin)
  }

  const handleChange = (raw: string) => {
    const accepted = mode === 'decimal' ? /^\d*(?:[.,]\d*)?$/.test(raw) : /^\d*$/.test(raw)
    if (!accepted) return
    setText(raw)
    if (raw === '') {
      onChange(undefined)
      return
    }
    if (raw.endsWith('.') || raw.endsWith(',')) return
    onChange(parse(raw))
  }

  const handleBlur = () => {
    focused.current = false
    selectOnFirstTap.current = true
    if (text === '' && fallback !== undefined) {
      setText(String(fallback))
      onChange(fallback)
      return
    }
    const parsed = parse(text)
    if (parsed !== undefined) {
      setText(String(parsed))
      onChange(parsed)
    }
  }

  return (
    <input
      type="text"
      inputMode={mode === 'decimal' ? 'decimal' : 'numeric'}
      pattern={mode === 'decimal' ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      autoComplete="off"
      onFocus={(event) => {
        focused.current = true
        selectOnFirstTap.current = true
        window.requestAnimationFrame(() => event.currentTarget.select())
      }}
      onPointerUp={(event) => {
        if (!selectOnFirstTap.current) return
        event.currentTarget.select()
        selectOnFirstTap.current = false
      }}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
    />
  )
}
