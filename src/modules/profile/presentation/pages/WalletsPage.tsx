import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { useResourceMutation } from '@/modules/shared/application/use-resource-mutation'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { FormError } from '@/components/ui/FormError'
import { AccountLayout } from '../components/AccountLayout'
import { WalletForm } from '../components/WalletForm'

export function WalletsPage() {
  const { queries } = useMarketplace()
  const wallets = useQuery(queries.wallets())
  const profile = useQuery(queries.profile())
  const [adding, setAdding] = useState<'primary' | 'secondary' | null>(null)
  const [saved, setSaved] = useState(false)
  const [secondaryPreference, setSecondaryPreference] = useState<boolean | null>(null)
  const preference = useResourceMutation(
    (api, context, checked: boolean) =>
      api.profile.update({ usePrimaryForSecondary: checked }, context),
    ['profile']
  )
  const primary = wallets.data?.items.find((wallet) => wallet.isPrimary)
  const secondary = wallets.data?.items.filter((wallet) => !wallet.isPrimary) ?? []
  const completed = () => {
    setAdding(null)
    setSaved(true)
  }
  return (
    <AccountLayout>
      <h1 className="sr-only">Carteiras</h1>
      <QueryFeedback query={wallets} />
      <QueryFeedback query={profile} />
      {wallets.data && profile.data && (
        <>
          <section aria-labelledby="primary-wallet-title" className="wallet-section">
            <div className="wallet-section-heading">
              <h2 id="primary-wallet-title">Carteira principal</h2>
              {primary && (
                <button
                  onClick={() => {
                    setAdding('primary')
                    setSaved(false)
                  }}
                >
                  Adicionar
                </button>
              )}
            </div>
            <p className="account-description">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
            {primary && adding !== 'primary' && (
              <WalletForm
                key={primary.id + primary.updatedAt}
                wallet={primary}
                primary
                profile={profile.data}
              />
            )}
            {(!primary || adding === 'primary') && (
              <WalletForm
                primary
                profile={profile.data}
                onSaved={completed}
                onCancel={primary ? () => setAdding(null) : undefined}
              />
            )}
          </section>
          <section aria-labelledby="secondary-wallet-title" className="wallet-section">
            <div className="wallet-section-heading">
              <h2 id="secondary-wallet-title">Carteira secundária</h2>
              <div className="secondary-wallet-actions">
                <label className="account-checkbox">
                  <input
                    type="checkbox"
                    checked={secondaryPreference ?? profile.data.usePrimaryForSecondary ?? false}
                    disabled={!primary || preference.isPending}
                    onChange={(event) => {
                      setSecondaryPreference(event.target.checked)
                      if (event.target.checked && adding === 'secondary') setAdding(null)
                      preference.mutate(event.target.checked, {
                        onSettled: () => setSecondaryPreference(null),
                      })
                    }}
                  />
                  Igual à carteira principal
                </label>
                <button
                  disabled={profile.data.usePrimaryForSecondary}
                  onClick={() => {
                    setAdding('secondary')
                    setSaved(false)
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
            {!secondary.length && adding !== 'secondary' && (
              <p className="account-description">
                {profile.data.usePrimaryForSecondary
                  ? 'A carteira principal também será usada como carteira secundária.'
                  : 'Você ainda não adicionou uma carteira secundária.'}
              </p>
            )}
            <FormError error={preference.error} id="wallet-preference-error" />
            {secondary.map((wallet) => (
              <WalletForm
                key={wallet.id + wallet.updatedAt}
                wallet={wallet}
                primary={false}
                profile={profile.data!}
              />
            ))}
            {adding === 'secondary' && (
              <WalletForm
                primary={false}
                profile={profile.data}
                onSaved={completed}
                onCancel={() => setAdding(null)}
              />
            )}
          </section>
          {saved && (
            <p role="status" className="account-success">
              Carteira salva.
            </p>
          )}
        </>
      )}
    </AccountLayout>
  )
}
