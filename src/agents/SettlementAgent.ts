import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { X402FacilitatorServer } from '../facilitator/X402FacilitatorServer'
import { resolveSolanaNetwork, createNonce, SolanaNetwork } from '../utils/solana'
import { loadKeypairFromEnv } from '../utils/wallet'
import { createLogger } from '../utils/logger'
import dotenv from 'dotenv'

dotenv.config()

export class SettlementAgent {
  private connection: Connection
  private agentWallet?: Keypair
  private facilitator: X402FacilitatorServer
  private merchantWallet?: string
  private networkId: string
  private network: SolanaNetwork
  private logger = createLogger('SettlementAgent')

  constructor(merchantWallet?: string) {
    const { network, rpcUrl, networkId } = resolveSolanaNetwork()
    this.network = network
    this.networkId = networkId

    // Allow merchant wallet from parameter or env variable
    if (merchantWallet) {
      this.merchantWallet = merchantWallet
    } else if (process.env.MERCHANT_WALLET_ADDRESS) {
      this.merchantWallet = process.env.MERCHANT_WALLET_ADDRESS
    }

    this.connection = new Connection(rpcUrl, 'confirmed')
    this.facilitator = new X402FacilitatorServer()

    try {
      const { keypair } = loadKeypairFromEnv()
      if (keypair) {
        this.agentWallet = keypair
        this.logger.info(`Settlement Agent initialized with wallet ${this.agentWallet.publicKey.toBase58()}`)
      }
    } catch (error) {
      this.logger.error('Failed to load agent wallet', error)
    }
  }

  async triggerSettlement(verification: any): Promise<void> {
    this.logger.info('Triggering settlement flow')
    await this.executeSettlement(verification)
  }

  async init(wallet?: Keypair): Promise<void> {
    try {
      // If a wallet is provided, use it instead of loading from env
      if (wallet) {
        this.agentWallet = wallet
        this.logger.info(`Settlement Agent initialized with provided wallet ${wallet.publicKey.toBase58()}`)
      } else if (!this.agentWallet) {
        this.logger.warn('AGENT_PRIVATE_KEY not configured. Some features will be unavailable.')
      }

      const agentId = process.env.SETTLEMENT_AGENT_ID
      this.logger.info('Initializing settlement agent')
      this.logger.info('SettlementAgent ready')
      this.logger.info(`Agent ID: ${agentId}`)
      this.logger.info(`RPC URL: ${process.env.SOLANA_RPC_URL}`)
      this.logger.info(`Network: ${this.network}`)
    } catch (error) {
      this.logger.error('Failed to initialize SettlementAgent', error)
      throw error
    }
  }

  /**
   * Set merchant wallet dynamically (for marketplace consumer)
   */
  setMerchantWallet(merchantWallet: string) {
    this.merchantWallet = merchantWallet
  }

  private createPaymentRequirements() {
    if (!this.merchantWallet) {
      throw new Error('Merchant wallet not set. Call setMerchantWallet() first.')
    }

    const paymentAmount = parseFloat(process.env.DEFAULT_PAYMENT_AMOUNT_USDC || '1.0')
    const amountInMicroUsdc = Math.floor(paymentAmount * 1_000_000)

    return {
      scheme: 'exact' as const,
      network: this.networkId,
      asset: process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      payTo: this.merchantWallet,
      maxAmountRequired: amountInMicroUsdc.toString(),
      resource: '/agent-settlement',
      description: 'A2A agent settlement via x402 on Solana',
      mimeType: 'application/json',
      maxTimeoutSeconds: 120
    }
  }

  private async executeSettlement(verification: any): Promise<void> {
    try {
      this.logger.info('Initiating settlement flow on Solana')

      const requirements = this.createPaymentRequirements()

      this.logger.info('Step 1: Creating payment authorization')
      const paymentPayload = this.createPaymentPayload(requirements)
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

      this.logger.debug('Payment payload structure', JSON.stringify(paymentPayload, null, 2))

      this.logger.info('Step 2: Verifying payment')
      const verificationResult = await this.facilitator.verify(paymentHeader, requirements)

      if (!verificationResult.isValid) {
        throw new Error(`Payment verification failed: ${verificationResult.invalidReason}`)
      }
      this.logger.info('Payment verification successful')

      this.logger.info('Step 3: Settling payment and executing USDC transfer')
      const settlementResult = await this.facilitator.settle(paymentHeader, requirements)

      if (!settlementResult.success) {
        throw new Error(`Payment settlement failed: ${settlementResult.error}`)
      }

      this.logger.info('Payment settled successfully')
      if (settlementResult.txHash) {
        this.logger.info(`Transaction signature: ${settlementResult.txHash}`)
      }

    } catch (error) {
      this.logger.error('Error executing settlement', error)
      throw error
    }
  }

  private createPaymentPayload(requirements: any) {
    if (!this.agentWallet) {
      throw new Error('Agent wallet not initialized')
    }

    const validBefore = Math.floor(Date.now() / 1000) + requirements.maxTimeoutSeconds

    return {
      x402Version: 1,
      scheme: requirements.scheme,
      network: requirements.network,
      payload: {
        authorization: {
          from: this.agentWallet.publicKey.toBase58(),
          to: requirements.payTo,
          value: requirements.maxAmountRequired,
          asset: requirements.asset,
          validBefore: validBefore,
          nonce: createNonce()
        }
      }
    }
  }

  /**
   * Creates a signed x402 payment
   */
  async createSignedPayment(recipientAddress: string, amountUsdc: number): Promise<string> {
    try {
      if (!this.agentWallet) {
        throw new Error('Agent wallet not initialized')
      }

      this.logger.info('Creating signed x402 payment')
      this.logger.info(`Amount: ${amountUsdc} USDC`)
      this.logger.info(`Recipient: ${recipientAddress}`)

      const amountInMicroUsdc = Math.floor(amountUsdc * 1_000_000)
      const recipientPubkey = new PublicKey(recipientAddress)
      const usdcMint = new PublicKey(process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

      // Create token instance
      const token = new Token(
        this.connection,
        usdcMint,
        TOKEN_PROGRAM_ID,
        this.agentWallet
      )

      // Get or create token accounts
      const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        this.agentWallet.publicKey
      )

      const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        recipientPubkey
      )

      this.logger.debug(`From: ${this.agentWallet.publicKey.toBase58()}`)
      this.logger.debug(`To: ${recipientAddress}`)

      // Create transfer instruction
      const transferInstruction = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        this.agentWallet.publicKey,
        [],
        amountInMicroUsdc
      )

      // Create transaction
      const transaction = new Transaction().add(transferInstruction)

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = this.agentWallet.publicKey

      // Sign transaction
      transaction.sign(this.agentWallet)

      this.logger.info('Transaction signed')

      // Create x402 payload with signed transaction
      const validBefore = Math.floor(Date.now() / 1000) + 300 // 5 minutes

      const paymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: this.networkId,
        payload: {
          authorization: {
            from: this.agentWallet.publicKey.toBase58(),
            to: recipientAddress,
            value: amountInMicroUsdc.toString(),
            asset: usdcMint.toBase58(),
            validBefore: validBefore,
            nonce: createNonce()
          },
          signedTransaction: transaction.serialize().toString('base64'),
          transactionMeta: {
            blockhash,
            lastValidBlockHeight
          }
        }
      }

      // Encode to base64
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

      this.logger.info('x402 payment created (signed transaction included)')

      return paymentHeader
    } catch (error) {
      this.logger.error('Error creating signed payment', error)
      throw error
    }
  }
}
