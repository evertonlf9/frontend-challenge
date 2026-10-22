import { readCheckoutDraft, saveCheckoutDraft } from '../../application/checkout-draft'
import { useId, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import type { useCheckout } from '../../application/use-checkout'
import type { CreateOrderInput } from '@/modules/orders/domain/order.contracts'
import { fieldErrorProps } from '@/components/ui/form-error-props'

export function CollectorForm({ checkout }: { checkout: ReturnType<typeof useCheckout> }) {
  const { owner, session } = checkout
  const noteId = useId()
  const saved = readCheckoutDraft(owner)
  const read = (form: HTMLFormElement): CreateOrderInput['collector'] => {
    const data = new FormData(form)
    return {
      name: String(data.get('name')),
      email: String(data.get('email')),
      handle: String(data.get('handle')),
      profileName: String(data.get('profileName')),
      referralCode: String(data.get('referralCode')),
      ensName: String(data.get('ensName') ?? ''),
      note: String(data.get('note') ?? ''),
      secondaryWalletAddress: String(data.get('secondaryWalletAddress') ?? ''),
      walletProvider: checkout.provider,
    }
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    checkout.startReview(read(event.currentTarget))
  }
  return (
    <div className="checkout-collector">
      <h2 className="checkout-profile-title">Perfil do colecionador</h2>
      <form
        id="collector-form"
        className="checkout-fields"
        onSubmit={submit}
        onChange={(event) => saveCheckoutDraft(owner, read(event.currentTarget))}
      >
        <label>
          Nome de exibição<span className="sr-only"> obrigatório</span>
          <input
            name="name"
            {...fieldErrorProps(checkout.create.error, 'collector.name', 'checkout-error')}
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={saved.name ?? session.data?.account.name}
            placeholder="Seu nome"
          />
        </label>
        <label>
          Nome de usuário
          <input
            name="handle"
            {...fieldErrorProps(checkout.create.error, 'collector.handle', 'checkout-error')}
            required
            pattern="@([a-zA-Z0-9._]|-)+"
            maxLength={40}
            defaultValue={saved.handle ?? checkout.profile.data?.handle ?? ''}
            placeholder="@seuusuario"
          />
        </label>
        <label>
          Rede da carteira
          <select
            {...fieldErrorProps(checkout.connection.error, 'network', 'connection-error')}
            value={checkout.chain}
            onChange={(event) => checkout.selectNetwork(event.target.value)}
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="solana">Solana</option>
          </select>
        </label>
        <label>
          Nome do perfil
          <input
            name="profileName"
            {...fieldErrorProps(checkout.create.error, 'collector.profileName', 'checkout-error')}
            required
            minLength={2}
            maxLength={100}
            defaultValue={saved.profileName ?? session.data?.account.name}
            placeholder="Nome do perfil"
          />
        </label>
        <label>
          Endereço da carteira
          <input
            value={checkout.wallet?.address ?? ''}
            readOnly
            aria-describedby="registered-wallet-help"
            placeholder="Endereço da carteira"
          />
        </label>
        <label>
          Carteira secundária (opcional)
          <input
            name="secondaryWalletAddress"
            {...fieldErrorProps(
              checkout.create.error,
              'collector.secondaryWalletAddress',
              'checkout-error'
            )}
            defaultValue={saved.secondaryWalletAddress}
            maxLength={100}
            placeholder="NFTs em outra carteira (opcional)"
          />
        </label>
        <label>
          Carteira cadastrada
          <select
            value={checkout.wallet?.id ?? ''}
            onChange={(event) => checkout.selectWallet(event.target.value)}
            required
          >
            <option value="" disabled>
              Selecione uma carteira
            </option>
            {checkout.wallets.data?.items.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Código de indicação
          <input
            name="referralCode"
            {...fieldErrorProps(checkout.create.error, 'collector.referralCode', 'checkout-error')}
            maxLength={40}
            defaultValue={saved.referralCode}
            placeholder="Código de indicação (opcional)"
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            {...fieldErrorProps(checkout.create.error, 'collector.email', 'checkout-error')}
            autoComplete="email"
            required
            defaultValue={saved.email ?? session.data?.account.email}
            placeholder="seu@email.com"
          />
        </label>
        <label>
          Nome ENS
          <input
            name="ensName"
            {...fieldErrorProps(checkout.create.error, 'collector.ensName', 'checkout-error')}
            maxLength={100}
            defaultValue={saved.ensName}
            placeholder="seunome.eth (opcional)"
          />
        </label>
        <p id="registered-wallet-help" className="checkout-wide checkout-notice">
          <Link to="/wallets" className="text-primary">
            Usar outra carteira?
          </Link>
          {' Cadastre ou edite suas carteiras.'}
        </p>
        <div className="collector-note">
          <label htmlFor={noteId}>Observação do colecionador (opcional)</label>
          <textarea
            id={noteId}
            name="note"
            {...fieldErrorProps(checkout.create.error, 'collector.note', 'checkout-error')}
            maxLength={500}
            defaultValue={saved.note}
          />
        </div>
      </form>
    </div>
  )
}
