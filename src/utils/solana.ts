import { clusterApiUrl, Cluster } from '@solana/web3.js'

export type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet-beta'

interface SolanaNetworkConfig {
  network: SolanaNetwork
  rpcUrl: string
  networkId: string
}

export interface NetworkRpcConfig {
  devnetRpcUrl?: string
  mainnetRpcUrl?: string
  testnetRpcUrl?: string
}

const NETWORK_ID_PREFIX = 'solana'

export function normalizeNetwork(raw?: string): SolanaNetwork {
  const value = (raw || 'devnet').toLowerCase()

  if (value === 'mainnet' || value === 'mainnet-beta' || value === 'mainnetbeta') {
    return 'mainnet-beta'
  }

  if (value === 'testnet') {
    return 'testnet'
  }

  return 'devnet'
}

export function networkToId(network: SolanaNetwork): string {
  return network === 'mainnet-beta'
    ? `${NETWORK_ID_PREFIX}-mainnet-beta`
    : `${NETWORK_ID_PREFIX}-${network}`
}

export function networkIdToNetwork(networkId: string): SolanaNetwork {
  const stripped = networkId.replace(`${NETWORK_ID_PREFIX}-`, '')
  return normalizeNetwork(stripped)
}

export function resolveSolanaNetwork(env: NodeJS.ProcessEnv = process.env): SolanaNetworkConfig {
  const network = normalizeNetwork(env.SOLANA_NETWORK)
  const rpcUrl = env.SOLANA_RPC_URL || clusterApiUrl(network as Cluster)
  const networkId = networkToId(network)

  return { network, rpcUrl, networkId }
}

/**
 * Resolve RPC URL for a specific network
 * Checks network-specific env vars first, then falls back to generic or default
 */
export function resolveRpcUrlForNetwork(
  network: SolanaNetwork,
  config?: NetworkRpcConfig,
  env: NodeJS.ProcessEnv = process.env
): string {
  // Check config object first (passed via constructor)
  if (config) {
    if (network === 'mainnet-beta' && config.mainnetRpcUrl) return config.mainnetRpcUrl
    if (network === 'devnet' && config.devnetRpcUrl) return config.devnetRpcUrl
    if (network === 'testnet' && config.testnetRpcUrl) return config.testnetRpcUrl
  }

  // Check network-specific environment variables
  if (network === 'mainnet-beta' && env.SOLANA_MAINNET_RPC_URL) {
    return env.SOLANA_MAINNET_RPC_URL
  }
  if (network === 'devnet' && env.SOLANA_DEVNET_RPC_URL) {
    return env.SOLANA_DEVNET_RPC_URL
  }
  if (network === 'testnet' && env.SOLANA_TESTNET_RPC_URL) {
    return env.SOLANA_TESTNET_RPC_URL
  }

  // Fall back to generic SOLANA_RPC_URL if set and matches current network
  const defaultNetwork = normalizeNetwork(env.SOLANA_NETWORK)
  if (env.SOLANA_RPC_URL && network === defaultNetwork) {
    return env.SOLANA_RPC_URL
  }

  // Fall back to public cluster URL
  return clusterApiUrl(network as Cluster)
}

export function isMainnet(network: SolanaNetwork): boolean {
  return network === 'mainnet-beta'
}

export function createNonce(length: number = 16): string {
  const { randomBytes } = require('crypto') as typeof import('crypto')
  return randomBytes(length).toString('hex')
}
