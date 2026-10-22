import { Minus, Plus } from 'lucide-react'
interface Props { label: string; value: number; maximum: number; disabled?: boolean; onChange: (value: number) => void }
export function QuantityControl({ label, value, maximum, disabled, onChange }: Props) {
  return <div className="quantity-control">
    <button type="button" aria-label={`Diminuir ${label}`} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}><Minus size={12} aria-hidden="true" /></button>
    <input aria-label={label} type="number" min={1} max={maximum} value={value} disabled={disabled} onChange={(event) => { const count = Number(event.target.value); if (Number.isInteger(count) && count > 0) onChange(count) }} />
    <button type="button" aria-label={`Aumentar ${label}`} disabled={disabled || value >= maximum} onClick={() => onChange(value + 1)}><Plus size={12} aria-hidden="true" /></button>
  </div>
}
