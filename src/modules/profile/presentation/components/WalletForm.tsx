import type { Profile } from '../../domain/profile.contracts'
import { readEnsName } from '../../application/ens-name'
import { useResourceMutation } from '@/modules/shared/application/use-resource-mutation'
import {
  WALLET_PROVIDERS,
  type Wallet,
  type CreateWalletInput,
} from '@/modules/wallets/domain/wallet.contracts'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/FormError'
import { fieldErrorProps } from '@/components/ui/form-error-props'
import { EnsField } from './EnsField'

export function WalletForm({
  wallet,
  primary,
  profile,
  onSaved,
  onCancel,
}: {
  wallet?: Wallet
  primary: boolean
  profile: Profile
  onSaved?: () => void
  onCancel?: () => void
}) {
  const save = useResourceMutation(
    (api, context, values: CreateWalletInput) =>
      wallet ? api.wallets.update(wallet.id, values, context) : api.wallets.create(values, context),
    ['wallets', 'quote']
  )
  const prefix = 'wallet-error-' + (wallet?.id ?? (primary ? 'new-primary' : 'new-secondary'))
  const errorProps = (field: string) => fieldErrorProps(save.error, field, prefix)
  return (
    <form
      className="wallet-form"
      aria-label={
        wallet
          ? `Editar ${wallet.label}`
          : primary
            ? 'Nova carteira principal'
            : 'Nova carteira secundária'
      }
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        save.mutate(
          {
            label: String(data.get('label')),
            address: String(data.get('address')),
            network: String(data.get('network')) as CreateWalletInput['network'],
            isPrimary: primary || data.get('isPrimary') === 'on',
            displayName: String(data.get('displayName')),
            profileName: String(data.get('profileName')),
            email: String(data.get('email')),
            provider: String(data.get('provider')) as CreateWalletInput['provider'],
            referralCode: String(data.get('referralCode')),
            secondaryAddress: String(data.get('secondaryAddress')),
            ensName: readEnsName(data),
          },
          { onSuccess: onSaved }
        )
      }}
    >
      <fieldset disabled={save.isPending} className="account-fields">
        <label className="account-field">
          Nome de exibição
          <span className="required-mark" aria-hidden="true" />
          <input
            name="displayName"
            required
            maxLength={100}
            defaultValue={wallet?.displayName ?? profile.name}
            {...errorProps('displayName')}
          />
        </label>
        <label className="account-field">
          Apelido da carteira
          <span className="required-mark" aria-hidden="true" />
          <input
            name="label"
            required
            minLength={2}
            maxLength={80}
            defaultValue={wallet?.label ?? ''}
            {...errorProps('label')}
          />
        </label>
        <label className="account-field">
          Rede
          <span className="required-mark" aria-hidden="true" />
          <select
            aria-label="Rede"
            name="network"
            defaultValue={wallet?.network ?? ''}
            required
            {...errorProps('network')}
          >
            <option value="" disabled>
              Selecione uma rede
            </option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="solana">Solana</option>
          </select>
        </label>
        <label className="account-field">
          Nome do perfil
          <span className="required-mark" aria-hidden="true" />
          <input
            name="profileName"
            defaultValue={wallet?.profileName ?? profile.handle}
            required
            maxLength={100}
            {...errorProps('profileName')}
          />
        </label>
        <label className="account-field">
          Endereço da carteira
          <span className="required-mark" aria-hidden="true" />
          <input
            name="address"
            required
            placeholder="Endereço da carteira"
            defaultValue={wallet?.address ?? ''}
            maxLength={100}
            {...errorProps('address')}
          />
        </label>
        <label className="account-field">
          <span className="sr-only">ENS ou carteira secundária</span>
          <input
            name="secondaryAddress"
            placeholder="ENS ou carteira secundária (opcional)"
            defaultValue={wallet?.secondaryAddress ?? ''}
            maxLength={100}
            {...errorProps('secondaryAddress')}
          />
        </label>
        <label className="account-field">
          Tipo de carteira
          <span className="required-mark" aria-hidden="true" />
          <select
            aria-label="Tipo de carteira"
            name="provider"
            defaultValue={wallet?.provider ?? 'MetaMask'}
            required
            {...errorProps('provider')}
          >
            <option value="" disabled>
              Selecione uma carteira
            </option>
            {WALLET_PROVIDERS.map((provider) => (
              <option key={provider}>{provider}</option>
            ))}
          </select>
        </label>
        <label className="account-field">
          Código de indicação
          <input
            name="referralCode"
            defaultValue={wallet?.referralCode ?? ''}
            maxLength={40}
            {...errorProps('referralCode')}
          />
        </label>
        <label className="account-field">
          E-mail
          <span className="required-mark" aria-hidden="true" />
          <input
            name="email"
            type="email"
            required
            defaultValue={wallet?.email ?? profile.email}
            maxLength={254}
            autoComplete="email"
            {...errorProps('email')}
          />
        </label>
        <EnsField value={wallet?.ensName} error={save.error} errorPrefix={prefix} />
      </fieldset>
      {!primary && (
        <label className="account-checkbox">
          <input type="checkbox" name="isPrimary" {...errorProps('isPrimary')} />
          Usar como principal
        </label>
      )}
      <FormError error={save.error} id={prefix} />
      <div className="wallet-form-actions">
        <Button className="account-save" type="submit" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
        {onCancel && (
          <button type="button" disabled={save.isPending} onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
      {save.isSuccess && (
        <p role="status" className="account-success">
          Carteira salva.
        </p>
      )}
    </form>
  )
}
