import { useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { AccountLayout } from '../components/AccountLayout'
import { ProfileEditor } from '../components/ProfileEditor'
import { ProfileFavorites } from '../components/ProfileFavorites'

export function ProfilePage() {
  const { queries } = useMarketplace()
  const profile = useQuery(queries.profile())
  const favorites = useRouterState({ select: (state) => state.location.hash === 'favoritos' })
  return <AccountLayout>{favorites ? <ProfileFavorites /> : <>
    <h1>Perfil do colecionador</h1>
    <QueryFeedback query={profile} />
    {profile.data && <ProfileEditor key={profile.data.id} profile={profile.data} />}
  </>}</AccountLayout>
}
