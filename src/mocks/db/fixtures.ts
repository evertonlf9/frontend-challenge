import type { NetworkId, Nft } from '@/modules/nft/domain/nft.contracts'
import type { Profile } from '@/modules/profile/domain/profile.contracts'
import type { Wallet } from '@/modules/wallets/domain/wallet.contracts'
import type { Coupon } from '@/modules/checkout/domain/quote.contracts'
import { hashPassword } from './password'
import type { MockState, MockUser } from './types'

/** Credenciais fictícias documentadas em docs/api-contracts.md. */
export const DEMO_CREDENTIALS = [
  { email: 'ana.ribeiro@kurio.dev', password: 'kurio1234' },
  { email: 'bruno.lima@kurio.dev', password: 'arte1234' },
] as const

export const COLLECTIONS = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const

const NETWORKS: readonly NetworkId[] = ['ethereum', 'polygon', 'solana']
const RARITIES = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'] as const
const TRAITS = [
  'Óculos',
  'Esmeralda',
  'Raro',
  'Chapéu',
  'Sobretudo',
  'Neon',
  'Coroa',
  'Máscara',
  'Asas',
  'Cristal',
  'Aurora',
  'Som',
] as const
const PREFIXES = [
  'Emerald',
  'Sage',
  'Neon',
  'Cosmic',
  'Violet',
  'Ivory',
  'Golden',
  'Crimson',
  'Azure',
  'Obsidian',
  'Solar',
  'Lunar',
  'Frost',
  'Amber',
  'Jade',
  'Onyx',
  'Coral',
  'Cobalt',
  'Ember',
  'Quartz',
  'Opal',
  'Slate',
] as const
const SUFFIXES = [
  'Ape',
  'Nomad',
  'Vessel',
  'Bloom',
  'Baron',
  'Signal',
  'Beat',
  'Drifter',
  'Keeper',
  'Oracle',
  'Wanderer',
  'Sentinel',
] as const
const CREATORS = ['alex_creative', 'mira.studio', 'nando.eth', 'labs.kurio'] as const

const IMAGE_PROMPTS = [
  'monkey%20nft%20digital%20art%20realistic%20portrait%20with%20green%20jacket%20and%20sunglasses',
  'monkey%20nft%20digital%20art%20with%20hat%20and%20purple%20hoodie',
  'monkey%20nft%20digital%20art%20with%20suit%20and%20gold%20chain',
  'abstract%20generative%20nft%20art%20with%20neon%20gradients',
  'futuristic%20cyberpunk%20avatar%20nft%20with%20visor',
  'surreal%20digital%20sculpture%20nft%20marble%20texture',
  'cosmic%20nebula%20digital%20art%20nft%20vibrant%20colors',
  'geometric%20low%20poly%20nft%20art%20with%20amber%20palette',
] as const

const AVATAR_PROMPTS = [
  'human%20face%20avatar%20realistic%20portrait',
  'female%20digital%20artist%20avatar%20portrait',
  'male%20crypto%20collector%20avatar%20portrait',
] as const

const BASE_DATE = Date.UTC(2026, 8, 20, 12, 0, 0)

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)] as T
}

function roundPrice(value: number): string {
  return Math.min(12.3, Math.max(0.02, Math.round(value * 100) / 100)).toFixed(2)
}

function imageUrl(prompt: string, _size: string): string {
  let value = 0
  for (const character of prompt) value = (value + character.charCodeAt(0)) % 8
  return '/artwork/' + ['emerald', 'sage', 'neon', 'golden'][value % 4] + '.webp'
}

function buildNfts(): Nft[] {
  const random = createRandom(20260920)

  return Array.from({ length: 36 }, (_, index) => {
    const percentile = random()
    const price = roundPrice(0.02 + percentile * 12.28)
    const hasPromotion = index % 5 === 0
    const previousPrice = hasPromotion ? roundPrice(Number(price) * 1.18) : null
    const availabilityRoll = random()
    const available =
      index === 0
        ? 20
        : availabilityRoll < 0.12
          ? 0
          : Math.max(1, Math.floor(availabilityRoll * 12))
    const collection = COLLECTIONS[index % COLLECTIONS.length] as string
    const network = NETWORKS[index % NETWORKS.length] as NetworkId
    const tokenNumber = String(index + 1).padStart(3, '0')
    const primaryPrompt = IMAGE_PROMPTS[index % IMAGE_PROMPTS.length] as string
    const updatedAt = new Date(BASE_DATE - index * 37 * 60_000).toISOString()

    const reference = [
      { name: 'Emerald Ape #042', price: '1.19', image: 'emerald' },
      { name: 'Sage Nomad #009', price: '1.69', image: 'sage' },
      { name: 'Neon Vessel #552', price: '1.99', image: 'neon' },
      { name: 'Cosmic Bloom #118', price: '1.29', image: 'sage' },
      { name: 'Violet Nomad #314', price: '1.39', image: 'sage' },
      { name: 'Ivory Baron #088', price: '1.79', image: 'neon' },
      { name: 'Golden Beat #207', price: '0.99', image: 'golden' },
      { name: 'Golden Keeper #091', price: '0.59', image: 'golden' },
      { name: 'Golden Signal #160', price: '0.39', image: 'golden' },
    ][index]
    return {
      id: `nft-${tokenNumber}`,
      name:
        reference?.name ?? `${pick(PREFIXES, random)} ${pick(SUFFIXES, random)} #${tokenNumber}`,
      description:
        'Obra digital certificada da coleção Kurio Editions, com procedência registrada e metadados no IPFS.',
      collection,
      network,
      priceEth: reference?.price ?? price,
      previousPriceEth: reference ? (index === 2 ? '2.29' : null) : previousPrice,
      available,
      maxPerOrder: Math.min(5, Math.max(1, available)),
      popularity: (index * 37 + 31) % 100,
      rarity: pick(RARITIES, random),
      attributes: Array.from({ length: 3 }, (_, attributeIndex) => ({
        trait: ['Cor', 'Acessório', 'Estilo'][attributeIndex] as string,
        value: pick(TRAITS, random),
      })),
      imageUrl: reference
        ? '/artwork/' + reference.image + '.webp'
        : imageUrl(primaryPrompt, 'square_hd'),
      galleryUrls: [
        reference ? '/artwork/' + reference.image + '.webp' : imageUrl(primaryPrompt, 'square_hd'),
        imageUrl(pick(IMAGE_PROMPTS, random), 'square'),
        imageUrl(pick(IMAGE_PROMPTS, random), 'square'),
        imageUrl(pick(IMAGE_PROMPTS, random), 'square'),
      ],
      creator: {
        handle: `@${pick(CREATORS, random)}`,
        avatarUrl: imageUrl(pick(AVATAR_PROMPTS, random), 'square'),
      },
      contractAddress: `0x${Math.floor(random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0')
        .repeat(5)
        .slice(0, 40)}`,
      tokenId: `#${tokenNumber}`,
      updatedAt,
      version: 1,
    } satisfies Nft
  })
}

function buildUsers(): {
  users: MockUser[]
  profiles: Record<string, Profile>
  wallets: Record<string, Wallet[]>
} {
  const seedDate = new Date(BASE_DATE - 400 * 24 * 60 * 60_000).toISOString()
  const users: MockUser[] = [
    {
      id: 'user-ana',
      name: 'Ana Ribeiro',
      email: 'ana.ribeiro@kurio.dev',
      passwordHash: hashPassword('kurio1234', 'user-ana'),
      createdAt: seedDate,
    },
    {
      id: 'user-bruno',
      name: 'Bruno Lima',
      email: 'bruno.lima@kurio.dev',
      passwordHash: hashPassword('arte1234', 'user-bruno'),
      createdAt: seedDate,
    },
  ]

  const profiles: Record<string, Profile> = {
    'user-ana': {
      id: 'user-ana',
      name: 'Ana Ribeiro',
      email: 'ana.ribeiro@kurio.dev',
      handle: '@ana.ribeiro',
      bio: 'Colecionadora de arte generativa e fotografia digital.',
      avatarUrl: imageUrl(AVATAR_PROMPTS[1], 'square'),
      updatedAt: seedDate,
    },
    'user-bruno': {
      id: 'user-bruno',
      name: 'Bruno Lima',
      email: 'bruno.lima@kurio.dev',
      handle: '@bruno.lima',
      bio: 'Criador de séries 3D e colecionáveis utilitários.',
      avatarUrl: imageUrl(AVATAR_PROMPTS[2], 'square'),
      updatedAt: seedDate,
    },
  }

  const wallets: Record<string, Wallet[]> = {
    'user-ana': [
      {
        id: 'wallet-ana-primary',
        label: 'Carteira principal',
        address: '0x7A2f19c4B0eD31a8C5Fb7420b9A1d3E6C8f40B21',
        network: 'ethereum',
        isPrimary: true,
        verified: true,
        createdAt: seedDate,
        updatedAt: seedDate,
      },
    ],
    'user-bruno': [
      {
        id: 'wallet-bruno-primary',
        label: 'Carteira principal',
        address: '0x91BdA54c2E7f8306D1a9C4b5E2F7a8D3C6b1E904',
        network: 'polygon',
        isPrimary: true,
        verified: true,
        createdAt: seedDate,
        updatedAt: seedDate,
      },
    ],
  }

  return { users, profiles, wallets }
}

function buildCoupons(): Coupon[] {
  return [
    {
      code: 'KURIO10',
      description: '10% de desconto na primeira compra',
      percentOff: 10,
      expiresAt: '2099-12-31T00:00:00.000Z',
    },
    {
      code: 'KURIO25',
      description: '25% de desconto em coleções selecionadas',
      percentOff: 25,
      expiresAt: '2099-12-31T00:00:00.000Z',
    },
    {
      code: 'EXPIRADO10',
      description: 'Cupom expirado para cenários de erro',
      percentOff: 10,
      expiresAt: new Date(BASE_DATE - 5 * 24 * 60 * 60_000).toISOString(),
    },
  ]
}

/** Restaura integralmente um cenário conhecido. */
export function createSeedState(): MockState {
  const { users, profiles, wallets } = buildUsers()

  return {
    revision: 1,
    scenario: 'default',
    users,
    sessions: [],
    nfts: buildNfts(),
    coupons: buildCoupons(),
    profiles,
    wallets,
    favorites: { 'user-ana': ['nft-001', 'nft-004'] },
    carts: {},
    orders: [],
    orderOwners: {},
    idempotency: {},
    quotes: {},
    counters: { session: 0, order: 0, quote: 0, wallet: 0 },
  }
}
