import { useId } from 'react'
import { fieldErrorProps } from '@/components/ui/form-error-props'
import { splitEnsName } from '../../application/ens-name'

export function EnsField({
  value,
  error,
  errorPrefix,
}: {
  value?: string
  error: unknown
  errorPrefix: string
}) {
  const ens = splitEnsName(value)
  const id = useId()
  return (
    <div className="account-field">
      <label htmlFor={id}>Nome ENS</label>
      <span className="account-ens">
        <select name="ensSuffix" aria-label="Extensão ENS" defaultValue={ens.suffix}>
          <option>.eth</option>
          <option>.sol</option>
          <option>.polygon</option>
        </select>
        <input
          id={id}
          name="ensName"
          defaultValue={ens.name}
          maxLength={90}
          {...fieldErrorProps(error, 'ensName', errorPrefix)}
        />
      </span>
    </div>
  )
}
