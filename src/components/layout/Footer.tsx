import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ReviewDialog } from '@/components/ui/ReviewDialog'

function LinkedinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM2 9h4v13H2Zm7 0h4v2c1-2 7-4 9 2v9h-4v-8c0-3-5-3-5 0v8H9Z" />
    </svg>
  )
}

export function Footer() {
  const [information, setInformation] = useState<string | null>(null)
  const info = (label: string) => setInformation(label + ' não está disponível nesta demonstração.')
  return (
    <footer className="site-container site-footer">
      <h2 className="sr-only">Sobre a Kurio e navegação complementar</h2>
      <div className="footer-features" id="criadores">
        {[
          [
            'W',
            'Segurança da carteira',
            'Proteja sua carteira e colecione arte digital verificada com confiança.',
          ],
          [
            'C',
            'Criadores em destaque',
            'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
          ],
          [
            'D',
            'Alertas de lançamentos',
            'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
          ],
        ].map(([icon, title, text]) => (
          <section className="footer-feature" key={icon}>
            <span className="feature-icon" aria-hidden="true">
              {icon}
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </section>
        ))}
        <form
          className="footer-newsletter"
          onSubmit={(event) => {
            event.preventDefault()
            setInformation(
              'A inscrição em novidades não está disponível nesta demonstração. Nenhum e-mail foi cadastrado.'
            )
          }}
        >
          <h3>Antecipe-se ao próximo lançamento</h3>
          <div className="newsletter-fields">
            <label className="sr-only" htmlFor="newsletter-email">
              E-mail para novidades
            </label>
            <input id="newsletter-email" type="email" required placeholder="digite seu e-mail..." />
            <Button type="submit">Enviar</Button>
          </div>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </form>
      </div>
      <div className="footer-contact">
        <Link to="/" className="brand">
          KURIO
        </Link>
        <p>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <button className="footer-link" onClick={() => info('Contato por e-mail')}>
          contato@email.com
        </button>
        <button className="footer-link" onClick={() => info('Atendimento telefônico')}>
          +55 11 4002 8922
        </button>
      </div>
      <div className="footer-links">
        <section>
          <h3>Meu perfil</h3>
          <ul>
            <li>
              <Link to="/profile">Meu perfil</Link>
            </li>
            <li>
              <Link to="/confirmation">Minha coleção</Link>
            </li>
            {['Atividade', 'Estúdio do criador'].map((label) => (
              <li key={label}>
                <button className="footer-link" onClick={() => info(label)}>
                  {label}
                </button>
              </li>
            ))}
            <li>
              <Link to="/profile" hash="favoritos">
                Lista de interesse
              </Link>
            </li>
          </ul>
        </section>
        <section>
          <h3>Central de ajuda</h3>
          <ul>
            {[
              'Central de ajuda',
              'Como comprar NFTs',
              'Carteira e segurança',
              'Política do mercado',
              'Denunciar item',
            ].map((label) => (
              <li key={label}>
                <button className="footer-link" onClick={() => info(label)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Coleções</h3>
          <ul>
            {['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'].map((collection) => (
              <li key={collection}>
                <Link to="/" hash="catalogo" search={{ collection, page: 1 }}>
                  {collection}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Redes sociais</h3>
          <div className="social-links">
            {[
              ['f', 'Facebook'],
              ['◎', 'Instagram'],
              ['X', 'X'],
              ['in', 'LinkedIn'],
              ['▶', 'YouTube'],
            ].map(([Icon, label]) => {
              return (
                <button
                  key={String(label)}
                  aria-label={String(label)}
                  onClick={() => info(String(label))}
                >
                  {label === 'LinkedIn' ? <LinkedinIcon /> : <span aria-hidden="true">{Icon}</span>}
                </button>
              )
            })}
          </div>
          <h3>Carteiras compatíveis</h3>
          <span className="wallet-brands">METAMASK · WALLETCONNECT · COINBASE</span>
        </section>
      </div>
      <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
      <ReviewDialog
        open={!!information}
        onClose={() => setInformation(null)}
        labelledBy="footer-information-title"
      >
        <div className="space-y-5">
          <h2 id="footer-information-title">Demonstração Kurio</h2>
          <p>{information}</p>
          <Button onClick={() => setInformation(null)}>Entendi</Button>
        </div>
      </ReviewDialog>
    </footer>
  )
}
