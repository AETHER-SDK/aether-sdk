import { clusterApiUrl, Cluster } from '@solana/web3.js'

export type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet-beta'

interface SolanaNetworkConfig {
  network: SolanaNetwork
  rpcUrl: string
  networkId: string
}

const NETWORK_ID_PREFIX = 'solana'

function normalizeNetwork(raw?: string): SolanaNetwork {
  const value = (raw || 'devnet').toLowerCase()

  if (value === 'mainnet' || value === 'mainnet-beta' || value === 'mainnetbeta') {
    return 'mainnet-beta'
  }

  if (value === 'testnet') {
    return 'testnet'
  }

  return 'devnet'
}

export function resolveSolanaNetwork(env: NodeJS.ProcessEnv = process.env): SolanaNetworkConfig {
  const network = normalizeNetwork(env.SOLANA_NETWORK)
  const rpcUrl = env.SOLANA_RPC_URL || clusterApiUrl(network as Cluster)
  const networkId = network === 'mainnet-beta'
    ? `${NETWORK_ID_PREFIX}-mainnet-beta`
    : `${NETWORK_ID_PREFIX}-${network}`

  return { network, rpcUrl, networkId }
}

export function isMainnet(network: SolanaNetwork): boolean {
  return network === 'mainnet-beta'
}

export function createNonce(length: number = 16): string {
  const { randomBytes } = require('crypto') as typeof import('crypto')
  return randomBytes(length).toString('hex')
}
