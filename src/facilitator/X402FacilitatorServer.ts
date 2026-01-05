import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { loadEnvIfNeeded } from '../utils/env'
import {
  resolveSolanaNetwork,
  resolveRpcUrlForNetwork,
  networkIdToNetwork,
  networkToId,
  SolanaNetwork,
  NetworkRpcConfig
} from '../utils/solana'
import { loadKeypairFromEnv } from '../utils/wallet'
import { createLogger } from '../utils/logger'

loadEnvIfNeeded()

export interface X402FacilitatorConfig {
  /** Network-specific RPC URLs (optional, falls back to env vars or public endpoints) */
  rpcConfig?: NetworkRpcConfig
  /** Default USDC mint address */
  usdcMint?: string
}

export class X402FacilitatorServer {
  private connections: Map<SolanaNetwork, Connection> = new Map()
  private agentWallet?: Keypair
  private usdcMint: PublicKey
  private defaultNetworkId: string
  private rpcConfig: NetworkRpcConfig | undefined
  private seenNonces: Map<string, number>
  private logger = createLogger('X402Facilitator')

  constructor(config?: X402FacilitatorConfig) {
    const { networkId } = resolveSolanaNetwork()
    const usdcMint = config?.usdcMint || process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

    this.rpcConfig = config?.rpcConfig
    this.usdcMint = new PublicKey(usdcMint)
    this.defaultNetworkId = networkId
    this.seenNonces = new Map()

    try {
      const { keypair } = loadKeypairFromEnv()
      if (keypair) {
        this.agentWallet = keypair
        this.logger.info(`Facilitator initialized with wallet ${this.agentWallet.publicKey.toBase58()}`)
      } else {
        this.logger.warn('AGENT_PRIVATE_KEY/AGENT_WALLET_PATH not configured. Some features will be unavailable.')
      }
    } catch (error) {
      this.logger.error('Failed to load facilitator wallet', error)
    }

    this.logger.info(`Default network: ${this.defaultNetworkId}`)
    if (this.rpcConfig) {
      this.logger.info('Custom RPC configuration provided')
    }
  }

  /**
   * Get or create a connection for a specific network
   * Connections are cached for reuse
   */
  private getConnection(networkId: string): Connection {
    const network = networkIdToNetwork(networkId)

    let connection = this.connections.get(network)
    if (!connection) {
      const rpcUrl = resolveRpcUrlForNetwork(network, this.rpcConfig)
      this.logger.debug(`Creating connection for ${network}: ${rpcUrl}`)
      connection = new Connection(rpcUrl, 'confirmed')
      this.connections.set(network, connection)
    }

    return connection
  }

  /**
   * Get the default connection (for backward compatibility)
   */
  private get connection(): Connection {
    return this.getConnection(this.defaultNetworkId)
  }

  /**
   * Get networkId (for backward compatibility)
   */
  private get networkId(): string {
    return this.defaultNetworkId
  }

  async verify(paymentHeader: string, paymentRequirements: any): Promise<any> {
    try {
      this.logger.info('Verifying payment header')

      const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())

      const validation = await this.validatePaymentLocally(paymentPayload, paymentRequirements)

      if (validation.isValid) {
        this.logger.info('Payment verification successful')
        return { isValid: true, invalidReason: null }
      } else {
        this.logger.warn('Payment verification failed')
        return { isValid: false, invalidReason: validation.reason || 'Local validation failed' }
      }
    } catch (error) {
      this.logger.error('Verification error', error)
      return {
        isValid: false,
        invalidReason: `Verification error: ${(error as Error).message}`
      }
    }
  }

  private async validatePaymentLocally(paymentPayload: any, requirements: any): Promise<{ isValid: boolean; reason?: string }> {
    try {
      if (paymentPayload.x402Version !== 1) {
        this.logger.warn('Invalid x402 version')
        return { isValid: false, reason: 'Invalid x402 version' }
      }

      if (paymentPayload.scheme !== requirements.scheme) {
        this.logger.warn('Scheme mismatch')
        return { isValid: false, reason: 'Scheme mismatch' }
      }

      // Network validation: check against requirements.network if provided, otherwise use payload's network
      const expectedNetwork = requirements.network || paymentPayload.network
      if (paymentPayload.network !== expectedNetwork) {
        this.logger.warn(`Network mismatch - expected ${expectedNetwork}, got ${paymentPayload.network}`)
        return { isValid: false, reason: 'Network mismatch' }
      }

      // Get the connection for this payment's network
      const connection = this.getConnection(paymentPayload.network)

      const authorization = paymentPayload.payload?.authorization
      if (!authorization) {
        this.logger.warn('No authorization found')
        return { isValid: false, reason: 'No authorization found' }
      }

      if (authorization.value !== requirements.maxAmountRequired) {
        this.logger.warn('Amount mismatch')
        return { isValid: false, reason: 'Amount mismatch' }
      }

      if (authorization.to !== requirements.payTo) {
        this.logger.warn('Recipient mismatch')
        return { isValid: false, reason: 'Recipient mismatch' }
      }

      if (authorization.asset !== requirements.asset) {
        this.logger.warn('Asset mint mismatch')
        return { isValid: false, reason: 'Asset mismatch' }
      }

      const now = Math.floor(Date.now() / 1000)
      if (!authorization.validBefore || now > authorization.validBefore) {
        this.logger.warn('Payment expired or missing validBefore')
        return { isValid: false, reason: 'Payment expired' }
      }

      if (requirements.maxTimeoutSeconds && authorization.validBefore - now > requirements.maxTimeoutSeconds + 30) {
        this.logger.warn('validBefore too far in the future')
        return { isValid: false, reason: 'Invalid validity window' }
      }

      const nonce = authorization.nonce
      if (!nonce) {
        this.logger.warn('Missing nonce')
        return { isValid: false, reason: 'Missing nonce' }
      }

      this.cleanupNonces()
      if (this.seenNonces.has(nonce)) {
        this.logger.warn('Replay detected (nonce already used)')
        return { isValid: false, reason: 'Replay detected' }
      }

      this.seenNonces.set(nonce, authorization.validBefore)

      await this.validateMintDecimals(authorization.asset, connection)

      if (paymentPayload.payload?.transactionMeta?.lastValidBlockHeight) {
        const currentHeight = await connection.getBlockHeight('confirmed')
        if (currentHeight > paymentPayload.payload.transactionMeta.lastValidBlockHeight) {
          this.logger.warn('Transaction blockhash expired')
          return { isValid: false, reason: 'Blockhash expired' }
        }
      }

      if (paymentPayload.payload?.signedTransaction) {
        const txValidation = await this.validateSignedTransaction(paymentPayload, connection)
        if (!txValidation.isValid) {
          return txValidation
        }
      }

      this.logger.info('All local validations passed')
      return { isValid: true }
    } catch (error) {
      this.logger.error('Local validation error', error)
      return { isValid: false, reason: (error as Error).message }
    }
  }

  async settle(paymentHeader: string, paymentRequirements: any): Promise<any> {
    try {
      this.logger.info('Settling payment on Solana')

      const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())

      // Determine network from payload or requirements
      const paymentNetworkId = paymentPayload.network || paymentRequirements.network || this.defaultNetworkId
      const connection = this.getConnection(paymentNetworkId)

      this.logger.info(`Using network: ${paymentNetworkId}`)

      const txHash = await this.executeUSDCTransfer(paymentPayload, paymentRequirements, connection)

      if (txHash) {
        this.logger.info('Payment settled successfully')
        this.logger.info(`Transaction Signature: ${txHash}`)
        this.logger.info(`Network: ${paymentNetworkId}`)

        return {
          success: true,
          error: null,
          txHash: txHash,
          networkId: paymentNetworkId
        }
      } else {
        this.logger.warn('Payment settlement failed')
        return {
          success: false,
          error: 'Failed to execute transfer',
          txHash: null,
          networkId: null
        }
      }
    } catch (error) {
      this.logger.error('Facilitator settlement error', error)
      return {
        success: false,
        error: `Settlement error: ${(error as Error).message}`,
        txHash: null,
        networkId: null
      }
    }
  }

  private async executeUSDCTransfer(paymentPayload: any, requirements: any, connection: Connection): Promise<string | null> {
    try {
      this.logger.info('Processing x402 payment on Solana')

      const authorization = paymentPayload.payload?.authorization
      if (!authorization) {
        throw new Error('No authorization found in payment payload')
      }

      // Check if payload contains a pre-signed transaction (standard x402 flow)
      const signedTransactionBase64 = paymentPayload.payload?.signedTransaction

      if (signedTransactionBase64) {
        // Standard x402 flow: Submit pre-signed transaction
        this.logger.info('Pre-signed transaction detected (standard x402 flow)')
        this.logger.debug(`From: ${authorization.from}`)
        this.logger.debug(`To: ${authorization.to}`)
        this.logger.debug(`Amount: ${Number(authorization.value) / 1_000_000} tokens`)

        // Deserialize the transaction
        const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64')
        const transaction = Transaction.from(transactionBuffer)

        this.logger.info('Submitting pre-signed transaction to Solana')
        const signature = await this.sendTransactionWithRetry(
          transaction,
          paymentPayload.payload.transactionMeta,
          connection
        )
        this.logger.info(`Transaction confirmed: ${signature}`)
        return signature

      } else {
        // Fallback: Old behavior (facilitator creates and executes the transaction)
        this.logger.warn('No pre-signed transaction - using legacy flow')

        if (!this.agentWallet) {
          throw new Error('Agent wallet not initialized (required for legacy flow)')
        }

        const recipientAddress = new PublicKey(authorization.to)
        const amount = Number(authorization.value)

        const token = new Token(
          connection,
          this.usdcMint,
          TOKEN_PROGRAM_ID,
          this.agentWallet
        )

        const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
          this.agentWallet.publicKey
        )

        const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
          recipientAddress
        )

        this.logger.debug(`Current USDC balance: ${Number(fromTokenAccount.amount) / 1_000_000} USDC`)
        this.logger.info(`Transfer amount: ${amount / 1_000_000} USDC`)
        this.logger.info(`Recipient: ${recipientAddress.toBase58()}`)

        if (Number(fromTokenAccount.amount) < amount) {
          throw new Error(`Insufficient USDC balance: ${Number(fromTokenAccount.amount) / 1_000_000} < ${amount / 1_000_000}`)
        }

        this.logger.info('Submitting transaction')
        const signature = await token.transfer(
          fromTokenAccount.address,
          toTokenAccount.address,
          this.agentWallet,
          [],
          amount
        )

        this.logger.info(`Transfer confirmed: ${signature}`)
        return signature
      }

    } catch (error) {
      this.logger.error('USDC transfer error', error)
      return null
    }
  }

  private async validateMintDecimals(mintAddress: string, connection: Connection): Promise<void> {
    const parsed = await connection.getParsedAccountInfo(new PublicKey(mintAddress))
    const decimals = (parsed.value as any)?.data?.parsed?.info?.decimals

    if (!parsed.value) {
      throw new Error('Mint account not found')
    }

    if (decimals !== 6) {
      throw new Error('Unexpected mint decimals (expected 6 for USDC/ATHR)')
    }
  }

  private cleanupNonces(): void {
    const now = Math.floor(Date.now() / 1000)
    for (const [nonce, expiry] of this.seenNonces.entries()) {
      if (expiry <= now) {
        this.seenNonces.delete(nonce)
      }
    }
  }

  private async validateSignedTransaction(paymentPayload: any, connection: Connection): Promise<{ isValid: boolean; reason?: string }> {
    const authorization = paymentPayload.payload?.authorization
    const signedTransactionBase64 = paymentPayload.payload?.signedTransaction

    if (!signedTransactionBase64) {
      return { isValid: true }
    }

    if (!authorization) {
      return { isValid: false, reason: 'Missing authorization block' }
    }

    try {
      const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64')
      const transaction = Transaction.from(transactionBuffer)

      if (!transaction.verifySignatures()) {
        return { isValid: false, reason: 'Invalid transaction signature' }
      }

      const instruction = transaction.instructions.find((ix) => ix.programId.equals(TOKEN_PROGRAM_ID))
      if (!instruction) {
        return { isValid: false, reason: 'Missing token transfer instruction' }
      }

      if (!instruction.data || instruction.data.length < 9 || instruction.data[0] !== 3) {
        return { isValid: false, reason: 'Invalid transfer instruction data' }
      }

      const amount = this.readU64(instruction.data.subarray(1, 9))
      if (amount.toString() !== authorization.value) {
        return { isValid: false, reason: 'Transfer amount mismatch' }
      }

      const destination = instruction.keys?.[1]?.pubkey
      if (!destination) {
        return { isValid: false, reason: 'Missing destination account' }
      }

      const destinationAccount = await connection.getParsedAccountInfo(destination)
      const destinationOwner = (destinationAccount.value as any)?.data?.parsed?.info?.owner
      const destinationMint = (destinationAccount.value as any)?.data?.parsed?.info?.mint

      if (!destinationAccount.value) {
        return { isValid: false, reason: 'Destination account not found' }
      }

      if (destinationOwner !== authorization.to) {
        return { isValid: false, reason: 'Destination owner mismatch' }
      }

      if (destinationMint !== authorization.asset) {
        return { isValid: false, reason: 'Destination mint mismatch' }
      }

      return { isValid: true }
    } catch (error) {
      return { isValid: false, reason: (error as Error).message }
    }
  }

  private readU64(buffer: Buffer): bigint {
    return buffer.readBigUInt64LE(0)
  }

  private async sendTransactionWithRetry(
    transaction: Transaction,
    meta: { blockhash?: string; lastValidBlockHeight?: number } | undefined,
    connection: Connection
  ): Promise<string> {
    const maxAttempts = 3
    const backoffMs = [500, 1000, 1500]
    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
          }
        )

        if (meta?.blockhash && meta?.lastValidBlockHeight) {
          await connection.confirmTransaction({
            signature,
            blockhash: meta.blockhash,
            lastValidBlockHeight: meta.lastValidBlockHeight
          }, 'confirmed')
        } else {
          await connection.confirmTransaction(signature, 'confirmed')
        }

        return signature
      } catch (error) {
        lastError = error
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]))
        }
      }
    }

    throw new Error(`Failed to send transaction after retries: ${String(lastError)}`)
  }

  /**
   * Get supported payment schemes
   * Returns all networks that can be handled (devnet and mainnet-beta)
   */
  getSupportedSchemes(): { kinds: Array<{ scheme: string; network: string }> } {
    return {
      kinds: [
        { scheme: 'exact', network: 'solana-devnet' },
        { scheme: 'exact', network: 'solana-mainnet-beta' }
      ]
    }
  }
}
