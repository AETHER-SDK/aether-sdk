import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import fs from 'fs'
import path from 'path'
import bs58 from 'bs58'
import { loadEnvIfNeeded } from './env'
import { isMainnet, SolanaNetwork } from './solana'

export interface WalletLoadResult {
  keypair?: Keypair
  source: 'path' | 'env' | 'kms' | 'none'
}

export function loadKeypairFromEnv(env: NodeJS.ProcessEnv = process.env): WalletLoadResult {
  loadEnvIfNeeded()

  // 1. Try explicit file path
  const walletPath = env.AGENT_WALLET_PATH || env.SOLANA_WALLET_PATH
  if (walletPath) {
    const resolvedPath = path.resolve(walletPath)
    const raw = fs.readFileSync(resolvedPath, 'utf-8').trim()
    const keypair = parseKeypair(raw)
    return { keypair, source: 'path' }
  }

  // 2. KMS placeholder
  if (env.AGENT_KMS_KEY) {
    throw new Error('KMS key loading not implemented: please supply a local keypair or AGENT_PRIVATE_KEY')
  }

  // 3. JSON or base58 in SOLANA_WALLET
  if (env.SOLANA_WALLET) {
    const keypair = parseKeypair(env.SOLANA_WALLET.trim())
    return { keypair, source: 'env' }
  }

  // 4. Legacy AGENT_PRIVATE_KEY (base58 secret key)
  if (env.AGENT_PRIVATE_KEY) {
    const keypair = Keypair.fromSecretKey(bs58.decode(env.AGENT_PRIVATE_KEY.trim()))
    return { keypair, source: 'env' }
  }

  return { source: 'none' }
}

function parseKeypair(raw: string): Keypair {
  try {
    // Array of numbers
    if (raw.startsWith('[')) {
      const secret = JSON.parse(raw) as number[]
      return Keypair.fromSecretKey(new Uint8Array(secret))
    }

    // JSON with secretKey
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.secretKey)) {
        return Keypair.fromSecretKey(new Uint8Array(parsed.secretKey))
      }
    }

    // Base58 string
    return Keypair.fromSecretKey(bs58.decode(raw))
  } catch (error) {
    throw new Error('Unable to parse keypair from provided data')
  }
}

export async function generateDevWallet(
  connection: Connection,
  network: SolanaNetwork,
  airdropSol: number = 1
): Promise<{ keypair: Keypair; airdropTx?: string }> {
  const keypair = Keypair.generate()

  if (!isMainnet(network)) {
    try {
      const signature = await connection.requestAirdrop(
        keypair.publicKey,
        Math.max(0, airdropSol) * LAMPORTS_PER_SOL
      )
      await connection.confirmTransaction(signature, 'confirmed')
      return { keypair, airdropTx: signature }
    } catch (error) {
      return { keypair }
    }
  }

  return { keypair }
}

export function assertMatchingMint(expected: string, actual: string): void {
  if (expected && actual && expected !== actual) {
    throw new Error(`Mint mismatch: expected ${expected}, got ${actual}`)
  }
}

export function parsePublicKey(value: string | PublicKey): PublicKey {
  return typeof value === 'string' ? new PublicKey(value) : value
}
