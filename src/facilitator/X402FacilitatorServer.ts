import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { loadEnvIfNeeded } from '../utils/env'
import { resolveSolanaNetwork } from '../utils/solana'
import { loadKeypairFromEnv } from '../utils/wallet'
import chalk from 'chalk'

loadEnvIfNeeded()

export class X402FacilitatorServer {
  private connection: Connection
  private agentWallet?: Keypair
  private usdcMint: PublicKey
  private networkId: string
  private seenNonces: Map<string, number>

  constructor() {
    const { rpcUrl, networkId } = resolveSolanaNetwork()
    const usdcMint = process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

    this.connection = new Connection(rpcUrl, 'confirmed')
    this.usdcMint = new PublicKey(usdcMint)
    this.networkId = networkId
    this.seenNonces = new Map()

    try {
      const { keypair } = loadKeypairFromEnv()
      if (keypair) {
        this.agentWallet = keypair
        console.log(chalk.green(`✅ Facilitator initialized with wallet: ${this.agentWallet.publicKey.toBase58()}`))
      } else {
        console.warn(chalk.yellow('⚠️  AGENT_PRIVATE_KEY/AGENT_WALLET_PATH not configured. Some features will be unavailable.'))
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to load facilitator wallet:'), error)
    }
  }

  async verify(paymentHeader: string, paymentRequirements: any): Promise<any> {
    try {
      console.log(chalk.blue('🔍 Facilitator: Verifying payment...'))

      const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())

      const validation = await this.validatePaymentLocally(paymentPayload, paymentRequirements)

      if (validation.isValid) {
        console.log(chalk.green('✅ Facilitator: Payment verification successful'))
        return { isValid: true, invalidReason: null }
      } else {
        console.log(chalk.red('❌ Facilitator: Payment verification failed'))
        return { isValid: false, invalidReason: validation.reason || 'Local validation failed' }
      }
    } catch (error) {
      console.error('❌ Facilitator: Verification error:', error)
      return {
        isValid: false,
        invalidReason: `Verification error: ${(error as Error).message}`
      }
    }
  }

  private async validatePaymentLocally(paymentPayload: any, requirements: any): Promise<{ isValid: boolean; reason?: string }> {
    try {
      if (paymentPayload.x402Version !== 1) {
        console.log(chalk.red('❌ Invalid x402 version'))
        return { isValid: false, reason: 'Invalid x402 version' }
      }

      if (paymentPayload.scheme !== requirements.scheme) {
        console.log(chalk.red('❌ Scheme mismatch'))
        return { isValid: false, reason: 'Scheme mismatch' }
      }

      if (paymentPayload.network !== this.networkId) {
        console.log(chalk.red(`❌ Network mismatch - expected ${this.networkId}`))
        return { isValid: false, reason: 'Network mismatch' }
      }

      const authorization = paymentPayload.payload?.authorization
      if (!authorization) {
        console.log(chalk.red('❌ No authorization found'))
        return { isValid: false, reason: 'No authorization found' }
      }

      if (authorization.value !== requirements.maxAmountRequired) {
        console.log(chalk.red('❌ Amount mismatch'))
        return { isValid: false, reason: 'Amount mismatch' }
      }

      if (authorization.to !== requirements.payTo) {
        console.log(chalk.red('❌ Recipient mismatch'))
        return { isValid: false, reason: 'Recipient mismatch' }
      }

      if (authorization.asset !== requirements.asset) {
        console.log(chalk.red('❌ Asset mint mismatch'))
        return { isValid: false, reason: 'Asset mismatch' }
      }

      const now = Math.floor(Date.now() / 1000)
      if (!authorization.validBefore || now > authorization.validBefore) {
        console.log(chalk.red('❌ Payment expired or missing validBefore'))
        return { isValid: false, reason: 'Payment expired' }
      }

      if (requirements.maxTimeoutSeconds && authorization.validBefore - now > requirements.maxTimeoutSeconds + 30) {
        console.log(chalk.red('❌ validBefore too far in the future'))
        return { isValid: false, reason: 'Invalid validity window' }
      }

      const nonce = authorization.nonce
      if (!nonce) {
        console.log(chalk.red('❌ Missing nonce'))
        return { isValid: false, reason: 'Missing nonce' }
      }

      this.cleanupNonces()
      if (this.seenNonces.has(nonce)) {
        console.log(chalk.red('❌ Replay detected (nonce already used)'))
        return { isValid: false, reason: 'Replay detected' }
      }

      this.seenNonces.set(nonce, authorization.validBefore)

      await this.validateMintDecimals(authorization.asset)

      if (paymentPayload.payload?.transactionMeta?.lastValidBlockHeight) {
        const currentHeight = await this.connection.getBlockHeight('confirmed')
        if (currentHeight > paymentPayload.payload.transactionMeta.lastValidBlockHeight) {
          console.log(chalk.red('❌ Transaction blockhash expired'))
          return { isValid: false, reason: 'Blockhash expired' }
        }
      }

      if (paymentPayload.payload?.signedTransaction) {
        const txValidation = await this.validateSignedTransaction(paymentPayload)
        if (!txValidation.isValid) {
          return txValidation
        }
      }

      console.log(chalk.green('✅ All local validations passed'))
      return { isValid: true }
    } catch (error) {
      console.error('❌ Local validation error:', error)
      return { isValid: false, reason: (error as Error).message }
    }
  }

  async settle(paymentHeader: string, paymentRequirements: any): Promise<any> {
    try {
      console.log(chalk.blue('🏦 Facilitator: Settling payment on Solana...'))

      const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())

      const txHash = await this.executeUSDCTransfer(paymentPayload, paymentRequirements)

      if (txHash) {
        console.log(chalk.green('✅ Facilitator: Payment settled successfully'))
        console.log(chalk.blue(`📋 Transaction Signature: ${txHash}`))
        console.log(chalk.blue(`📋 Network: ${this.networkId}`))

        return {
          success: true,
          error: null,
          txHash: txHash,
          networkId: this.networkId
        }
      } else {
        console.log(chalk.red('❌ Facilitator: Payment settlement failed'))
        return {
          success: false,
          error: 'Failed to execute transfer',
          txHash: null,
          networkId: null
        }
      }
    } catch (error) {
      console.error('❌ Facilitator: Settlement error:', error)
      return {
        success: false,
        error: `Settlement error: ${(error as Error).message}`,
        txHash: null,
        networkId: null
      }
    }
  }

  private async executeUSDCTransfer(paymentPayload: any, requirements: any): Promise<string | null> {
    try {
      console.log(chalk.blue('💰 Processing x402 payment on Solana...'))

      const authorization = paymentPayload.payload?.authorization
      if (!authorization) {
        throw new Error('No authorization found in payment payload')
      }

      // Check if payload contains a pre-signed transaction (standard x402 flow)
      const signedTransactionBase64 = paymentPayload.payload?.signedTransaction

      if (signedTransactionBase64) {
        // Standard x402 flow: Submit pre-signed transaction
        console.log(chalk.blue('📋 Pre-signed transaction detected (standard x402 flow)'))
        console.log(chalk.blue(`📋 From: ${authorization.from}`))
        console.log(chalk.blue(`📋 To: ${authorization.to}`))
        console.log(chalk.blue(`📋 Amount: ${Number(authorization.value) / 1_000_000} USDC`))

        // Deserialize the transaction
        const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64')
        const transaction = Transaction.from(transactionBuffer)

        console.log(chalk.yellow('📋 Submitting pre-signed transaction to Solana...'))
        const signature = await this.sendTransactionWithRetry(
          transaction,
          paymentPayload.payload.transactionMeta
        )
        console.log(chalk.green(`✅ Transaction confirmed: ${signature}`))
        return signature

      } else {
        // Fallback: Old behavior (facilitator creates and executes the transaction)
        console.log(chalk.yellow('⚠️  No pre-signed transaction - using legacy flow'))

        if (!this.agentWallet) {
          throw new Error('Agent wallet not initialized (required for legacy flow)')
        }

        const recipientAddress = new PublicKey(authorization.to)
        const amount = Number(authorization.value)

        const token = new Token(
          this.connection,
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

        console.log(chalk.blue(`📋 Current USDC balance: ${Number(fromTokenAccount.amount) / 1_000_000} USDC`))
        console.log(chalk.blue(`📋 Transfer amount: ${amount / 1_000_000} USDC`))
        console.log(chalk.blue(`📋 Recipient: ${recipientAddress.toBase58()}`))

        if (Number(fromTokenAccount.amount) < amount) {
          throw new Error(`Insufficient USDC balance: ${Number(fromTokenAccount.amount) / 1_000_000} < ${amount / 1_000_000}`)
        }

        console.log(chalk.yellow('📋 Submitting transaction...'))
        const signature = await token.transfer(
          fromTokenAccount.address,
          toTokenAccount.address,
          this.agentWallet,
          [],
          amount
        )

        console.log(chalk.green(`✅ Transfer confirmed: ${signature}`))
        return signature
      }

    } catch (error) {
      console.error('❌ USDC transfer error:', error)
      return null
    }
  }

  private async validateMintDecimals(mintAddress: string): Promise<void> {
    const parsed = await this.connection.getParsedAccountInfo(new PublicKey(mintAddress))
    const decimals = (parsed.value as any)?.data?.parsed?.info?.decimals

    if (!parsed.value) {
      throw new Error('Mint account not found')
    }

    if (decimals !== 6) {
      throw new Error('Unexpected mint decimals (expected 6 for USDC)')
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

  private async validateSignedTransaction(paymentPayload: any): Promise<{ isValid: boolean; reason?: string }> {
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

      const destinationAccount = await this.connection.getParsedAccountInfo(destination)
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

  private async sendTransactionWithRetry(transaction: Transaction, meta?: { blockhash?: string; lastValidBlockHeight?: number }): Promise<string> {
    const maxAttempts = 3
    const backoffMs = [500, 1000, 1500]
    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const signature = await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
          }
        )

        if (meta?.blockhash && meta?.lastValidBlockHeight) {
          await this.connection.confirmTransaction({
            signature,
            blockhash: meta.blockhash,
            lastValidBlockHeight: meta.lastValidBlockHeight
          }, 'confirmed')
        } else {
          await this.connection.confirmTransaction(signature, 'confirmed')
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

  getSupportedSchemes(): { kinds: Array<{ scheme: string; network: string }> } {
    return {
      kinds: [
        { scheme: 'exact', network: this.networkId }
      ]
    }
  }
}
