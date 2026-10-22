# Kurio — Marketplace de NFTs

Implementação do [desafio original](docs/CHALLENGE.md), preservando React/TypeScript, a stack obrigatória, as rotas e a identidade visual existentes. APIs, contas, carteiras, pagamentos e eventos são simulados na rede.

## Executar

Requer Node.js >=24.8 e npm >=11.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Acesse a URL exibida pelo Vite. Para testar o mesmo artefato da demonstração:

```sh
npm run build:mock
npm run preview -- --host localhost --port 4174
```

Não depende de backend, extensão de carteira, fontes externas nem imagens remotas. A fonte Roboto Mono e as quatro artes recriadas estão incluídas; veja [ASSETS.md](docs/ASSETS.md). A instalação limpa pode precisar de acesso à internet para baixar dependências e Chromium.

## Ambiente

Copie `.env.example` para `.env.local` apenas se precisar sobrescrever as configurações. O modo `mock` já habilita o MSW por meio de `.env.mock`.

| Variável | Padrão | Uso |
| --- | --- | --- |
| VITE_ENABLE_MOCKS | true | Ativa os handlers REST e WebSocket quando true |
| VITE_API_URL | /api | URL base REST |
| VITE_SOCKET_URL | origem atual | Origem do servidor Socket.IO |
| VITE_MOCK_SCENARIO | default | Cenário inicial quando ainda não há estado persistido |

`npm run dev` e `npm run build` habilitam os mocks por padrão; os aliases `dev:mock` e `build:mock` também são mantidos. Para usar um backend compatível, use `dev:api` ou `build:api`, ou defina `VITE_ENABLE_MOCKS=false` explicitamente. Variáveis VITE são públicas e incorporadas no build.

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana Ribeiro | ana.ribeiro@kurio.dev | kurio1234 |
| Bruno Lima | bruno.lima@kurio.dev | arte1234 |

Ana tem uma carteira Ethereum, Bruno uma Polygon. Use itens da mesma rede da carteira ou cadastre outra carteira. Endereços EVM de demonstração aceitam `0x` seguido de 40 caracteres hexadecimais; Solana aceita um endereço base58 válido. Os hashes das senhas são apenas uma simulação local; não constituem um sistema de autenticação para produção.

## Login e cadastro

O botão Entrar abre um modal sobre o catálogo. As rotas /login e /register também aceitam acesso direto. As abas preservam o destino de retorno; Escape ou o botão de fechar encerram o modal. Login usa e-mail e senha; cadastro exige nome de usuário, e-mail, senha de pelo menos oito caracteres e confirmação igual. Erros da API aparecem no formulário.

Google, Facebook e recuperação por e-mail são ações auxiliares sem integração configurada. Os botões explicam essa limitação sem criar sessões ou alegar envio de mensagens. A autenticação por e-mail e o cadastro usam a API simulada real do projeto.

## Fluxo principal

1. Explore o catálogo. Combine busca, coleção, rede e faixa de preço, ordene ou troque a página. A URL preserva os critérios no refresh e no histórico.
2. Abra o NFT, escolha a imagem e a quantidade e clique em COMPRAR. O carrinho do visitante é mesclado ao da conta no login.
3. No carrinho, ajuste quantidades ou remova itens. Use `KURIO10` ou `KURIO25` para desconto; `EXPIRADO10` exercita expiração.
4. Entre para acessar o pagamento. Preencha os dados, selecione carteira/rede e conecte a carteira simulada.
5. Abra a revisão e confirme. A API revalida as condições; alterações exigem nova confirmação.
6. O recibo aparece somente quando o pedido está confirmado. Pedidos pendentes e recusados têm estados próprios. O carrinho só perde as quantidades efetivamente compradas.

Perfil, avatar (URL ou upload PNG/JPEG/WebP de até 1 MB), senha e carteiras são editáveis e persistidos pela API simulada.

No perfil, use **URL do avatar → Usar URL do avatar** para aplicar uma imagem HTTP(S), ou **Alterar** para enviar um arquivo. URLs com credenciais ou outros protocolos são rejeitadas. **Remover** limpa o avatar e a URL; salvar o restante do perfil não restaura uma imagem removida.

## Cenários e reset

Os controles existem somente com MSW ativo e também estão disponíveis no build de demonstração. No console do navegador:

```js
const control = async (path, data, method = 'POST') => {
  const response = await fetch('/api/__mocks/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  return response.json()
}

// Consultar cenários
await fetch('/api/__mocks/scenarios').then(r => r.json())
// Selecionar cenário e recarregar para refazer as consultas
await control('scenario', { scenario: 'slow' }, 'PUT')
location.reload()
// Reset integral dos dados da API (sessões, estoque, contas, pedidos etc.)
await control('reset')
location.reload()
```

Para limpar também preferências, rascunhos e tentativas deste navegador, execute `localStorage.clear(); sessionStorage.clear(); location.reload()` após o reset. O reset da API invalida os tokens antigos. Cada teste recebe seu próprio contexto de navegador.

| Cenário | Comportamento e reprodução |
| --- | --- |
| default | Sucesso, 36 NFTs e dois usuários |
| empty-catalog | Catálogo vazio |
| slow | Latência determinística de 1,2 a 2,5 segundos |
| out-of-order | Catálogo alterna atrasos de 1,6 s e 250 ms |
| offline | Falha de conexão em todas as operações |
| server-error | HTTP 503 |
| flaky | Falha transitória a cada terceira requisição |
| session-expired | Recursos privados retornam 401 |
| favorite-error | Leitura funciona; alteração de favorito falha após 600 ms, exercitando rollback |
| coupon-invalid | Cupom rejeitado pela cotação |
| availability-conflict | Carrinho/cotação/pedido rejeitam falta de estoque |
| wallet-refused | Conexão da carteira recusada |
| payment-declined | Pedido recusado; carrinho preservado |
| payment-pending | Pedido aguarda encerramento pelo controle |
| order-timeout | Pedido persistido; resposta demora 16 s e excede o timeout Axios de 15 s |
| invalid-catalog-response | Listagem devolve um preço numérico, rejeitado pelo validador do cliente; volte a default e use Tentar novamente |
| invalid-order-response | Pedido é persistido, mas a primeira resposta tem total inválido; Recuperar tentativa anterior devolve o mesmo pedido com contrato válido |

Para cadastro conflitante, tente cadastrar um dos e-mails acima. Para validação de perfil, use um identificador sem `@`; para senha, informe uma senha atual incorreta; para carteira, informe um endereço inválido.

### Alteração real de preço/estoque no carrinho ou checkout

Com o NFT no carrinho e a revisão aberta, obtenha seu ID na URL do detalhe e execute:

```js
await control('nfts/nft-001', { priceEth: '0.2' }, 'PATCH')
await control('nfts/nft-001', { available: 0 }, 'PATCH')
```

Troque o ID pelo item do seu carrinho. A mesma alteração atualiza o estado REST e publica `nft.updated` pelo transporte Socket.IO. A interface informa a alteração. Preço novo exige nova revisão; estoque insuficiente impede o envio.

### Pedido pendente, desconexão e resultado

Selecione `payment-pending`, compre e copie o ID da URL `/orders/<id>`.

```js
await control('socket/disconnect')
await control('orders/order_0001/settle', { status: 'confirmed' })
// Ou { status: 'declined' }; um estado terminal nunca é revertido.
```

Socket.IO reconecta e reconcilia com REST; o pedido também é consultado a cada 2 s enquanto pendente. Refresh recupera a mesma compra.

### Timeout e reenvio

Selecione `order-timeout` antes de confirmar. Após a mensagem de timeout, recarregue a página e clique em **Recuperar tentativa anterior**. O payload e a chave originais recuperam o mesmo pedido. Não apague o armazenamento entre a falha e a recuperação.

### Duplicatas e eventos antigos

```js
await control('events/replay', {
  type: 'nft.updated', resourceId: 'nft-001', version: 1, priceEth: '0.01'
})
await control('events/replay', {
  type: 'order.updated', resourceId: 'order_0001', version: 1, status: 'pending'
})
```

Esses controles passam pelo servidor MSW e pelos listeners do cliente Socket.IO. Eles não alteram diretamente a interface ou o cache. Eventos antigos/duplicados são descartados.

## Verificações

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run check
npm run test:a11y
npm run test:e2e
npm run test:visual
npm run test:all
npm run test:report
npm run test:default
npm run test:build
npm run audit:lighthouse
npm run evidence:collect
# Ou toda a sequência, interrompendo em caso de falha:
npm run verify
```

Playwright executa Chromium em desktop 1440×900 e mobile 390×844; a suíte verifica também 768 px. Os testes REST usam Axios e MSW; os testes de fluxo observam a interface. Os cenários de tempo real usam o cliente Socket.IO real, com eventos de controle emitidos pelo mock. O relógio de dados e as fixtures são estáveis; cada teste usa um contexto isolado.

`test:unit` usa o runner nativo do Node e a transformação TypeScript do Vite já instalado, sem uma dependência adicional de testes. Verifica precisão decimal, cotação, idempotência, estoque, snapshot, isolamento, validação de respostas/eventos, retry e redirecionamentos. Os testes de interface incluem o painel de acessibilidade em 320×256, equivalente à área útil de zoom elevado.

Após `npm run build:mock`, `test:build` verifica o artefato servido por preview: catálogo, acesso direto, atualização de preço via MSW/Socket.IO, login, compra e recuperação do recibo no refresh. A auditoria Lighthouse executa esse mesmo fluxo antes das medições, para rejeitar builds que exibam apenas uma tela de erro.

`test:e2e` exclui os arquivos `*.visual.spec.ts` pela configuração, sem desabilitar assertions de screenshots globalmente. `test:visual` compara as telas e diálogos, incluindo os quatro baselines obrigatórios de início, detalhe, carrinho e pagamento em ambos os viewports. `test:all` executa as duas suítes. Atualize baselines com `npm run test:visual:update` somente após revisar as diferenças. Relatório HTML E2E em `playwright-report/e2e/index.html`; regressão visual em `playwright-report/visual/index.html`; traces e screenshots de falhas em `test-results/`.

`test:a11y` verifica regras WCAG A/AA até 2.2 e boas práticas com axe-core nas nove rotas e na revisão da compra, além de teclado, foco, movimento reduzido e zoom. Os resultados JSON anexados preservam violações e verificações inconclusivas para revisão manual. O axe-core é uma dependência exclusiva de desenvolvimento e não entra no bundle da aplicação. A aprovação automatizada não certifica conformidade integral com WCAG.

`evidence:collect` reúne HTML/JSON, anexos do axe, traces, configurações e documentação em uma pasta nova de `artifacts/quality/`, com manifesto e hashes SHA-256 das fontes. Os relatórios são ignorados pelo Git: inclua essa pasta no pacote da entrega ou baixe o artefato do workflow `.github/workflows/quality.yml`. O workflow usa Windows para corresponder às baselines `win32`, preserva evidências mesmo em falhas e precisa ser executado no repositório GitHub para validar o ambiente remoto.

As configurações E2E e visual são separadas (`playwright.config.ts` e `playwright.visual.config.ts`), para manter os diretórios de artefatos consistentes também nos workers. O estado da última verificação e as pendências de entrega ficam em [verification.json](docs/verification.json).

Lighthouse usa o build otimizado com mocks e assets completos, três medições por rota/perfil em início e detalhe. HTML/JSON e medianas de Performance, Accessibility, Best Practices, SEO, LCP, CLS e TBT ficam em `lighthouse-reports/`. A configuração versionada está em `lighthouserc.cjs`; o comando retorna erro se houver categorias abaixo das metas. Consulte [a auditoria](docs/PERFORMANCE.md).

## Arquitetura e contratos

- [ARCHITECTURE.md](ARCHITECTURE.md): responsabilidades, decisões, limitações, sessão, cache e reconciliação.
- [Contratos REST e eventos](docs/api-contracts.md).
- [Desafio original](docs/CHALLENGE.md).

## Publicação

O build estático de demonstração está em `dist/`. `index.html` contém o início pré-renderizado; `app.html` é o documento leve das demais rotas. Configurações Vercel, Netlify e `public/_redirects` incluem fallback para `app.html`, permitindo acesso direto e refresh. O preview aplica o mesmo fallback das rotas internas. Na Vercel, o comando é `npm run build:mock` e a saída é `dist`. Na Netlify, use a configuração versionada. Ambos os HTMLs devem acompanhar os assets na publicação.

A publicação pública permanece pendente. As instruções e os resultados de validação estão em [DELIVERY.md](docs/DELIVERY.md).

## Layout e revisão manual

A interface segue as capturas de referência e as instruções de agentes/CLAUDE.md e agentes/dev-frontend-senior.md. Os detalhes de tipografia, assets recriados e adaptações responsivas estão em [ASSETS.md](docs/ASSETS.md). A regra de Git manual foi preservada; consulte [DELIVERY.md](docs/DELIVERY.md).

As abas Todos os NFTs, Novos lançamentos e Em alta também compõem a URL (`view=all|new|trending`). A busca abre no ícone do cabeçalho. Os filtros de preço aceitam até 18 casas decimais, inclusive em URLs diretas.
