import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { processPayment, x402Utils, verifyPayment, settlePayment } from 'a2a-x402'
import { Wallet, JsonRpcProvider } from 'ethers'
import { Client, PrivateKey, AccountId, TransferTransaction, Hbar, AccountBalanceQuery } from '@hashgraph/sdk'
import { HCS10ConnectionManager } from '../protocols/HCS10ConnectionManager'
import { HCS10TransactionApproval } from '../protocols/HCS10TransactionApproval'
import chalk from 'chalk'
import dotenv from 'dotenv'
import { X402FacilitatorServer } from '../facilitator/X402FacilitatorServer'

// Load environment variables
dotenv.config()

export class SettlementAgent {
  private hcsClient: HCS10Client
  private provider: JsonRpcProvider
  private wallet: Wallet
  private hederaClient?: Client
  private paymentNetwork: 'hedera-testnet' | 'base-sepolia'
  private x402Utils: typeof x402Utils
  private facilitator: X402FacilitatorServer
  private connectionManager?: HCS10ConnectionManager
  private transactionApproval?: HCS10TransactionApproval

  constructor() {
    // Get agent credentials from environment variables
    const agentId = process.env.SETTLEMENT_AGENT_ID
    const privateKey = process.env.SETTLEMENT_PRIVATE_KEY
    const baseRpcUrl = process.env.BASE_RPC_URL
    const walletPrivateKey = process.env.SETTLEMENT_WALLET_PRIVATE_KEY

    if (!agentId || !privateKey || !baseRpcUrl || !walletPrivateKey) {
      throw new Error('Missing required environment variables: SETTLEMENT_AGENT_ID, SETTLEMENT_PRIVATE_KEY, BASE_RPC_URL, and SETTLEMENT_WALLET_PRIVATE_KEY')
    }

    // Check if we have a placeholder private key
    if (privateKey.startsWith('placeholder-key-for-')) {
      console.warn('⚠️  Using placeholder private key. Agent registration may not have captured the actual private key.')
      console.warn('⚠️  For now, we\'ll use the main Hedera account for testing.')
      
      // Use the main Hedera account credentials for testing
      const mainAccountId = process.env.HEDERA_ACCOUNT_ID
      const mainPrivateKey = process.env.HEDERA_PRIVATE_KEY
      
      if (!mainAccountId || !mainPrivateKey) {
        throw new Error('Missing main Hedera credentials for fallback')
      }
      
      // Initialize HCS10Client with main account for now
      this.hcsClient = new HCS10Client(mainAccountId, mainPrivateKey, 'testnet')
      
      // Initialize connection manager and transaction approval (optional)
      const useConnections = process.env.USE_HCS10_CONNECTIONS === 'true'
      if (useConnections) {
        this.connectionManager = new HCS10ConnectionManager(this.hcsClient, mainAccountId)
        this.transactionApproval = new HCS10TransactionApproval(this.hcsClient, mainAccountId)
      }
    } else {
      // Initialize HCS10Client with actual agent credentials
      this.hcsClient = new HCS10Client(agentId, privateKey, 'testnet')
      
      // Initialize connection manager and transaction approval (optional)
      const useConnections = process.env.USE_HCS10_CONNECTIONS === 'true'
      if (useConnections) {
        this.connectionManager = new HCS10ConnectionManager(this.hcsClient, agentId)
        this.transactionApproval = new HCS10TransactionApproval(this.hcsClient, agentId)
      }
    }

    // Initialize provider with BASE_RPC_URL
    this.provider = new JsonRpcProvider(baseRpcUrl)

    // Initialize wallet with SETTLEMENT_WALLET_PRIVATE_KEY + provider
    this.wallet = new Wallet(walletPrivateKey, this.provider)

    // Initialize x402Utils
    this.x402Utils = x402Utils

    // Initialize facilitator server
    this.facilitator = new X402FacilitatorServer()

    // Determine payment network
    this.paymentNetwork = (process.env.PAYMENT_NETWORK || 'base-sepolia') as 'hedera-testnet' | 'base-sepolia'

    // Initialize Hedera client if using Hedera network
    if (this.paymentNetwork === 'hedera-testnet') {
      const mainAccountId = process.env.HEDERA_ACCOUNT_ID
      const mainPrivateKey = process.env.HEDERA_PRIVATE_KEY
      
      if (!mainAccountId || !mainPrivateKey) {
        throw new Error('Missing required Hedera credentials for Hedera network: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY')
      }

      this.hederaClient = Client.forTestnet()
      const accountId = AccountId.fromString(mainAccountId)
      const privateKeyObj = PrivateKey.fromString(mainPrivateKey)
      this.hederaClient.setOperator(accountId, privateKeyObj)
      
      console.log(chalk.blue('✅ Hedera client initialized for payments'))
    }
  }

  // Public method to trigger settlement from external calls
  async triggerSettlement(verification: any): Promise<void> {
    console.log(chalk.yellow('🔧 SettlementAgent: Triggering settlement...'))
    await this.executeSettlement(verification)
  }

  async init(): Promise<void> {
    try {
      // Get topic ID from environment
      const topicId = process.env.SETTLEMENT_TOPIC_ID
      if (!topicId) {
        throw new Error('Missing required environment variable: SETTLEMENT_TOPIC_ID')
      }

      // Start polling for messages (HCS10Client doesn't have connect/subscribe methods)
      this.startMessagePolling(topicId)

      console.log(chalk.yellow('Listening for approvals...'))
      console.log(`🔗 SettlementAgent initialized for Hedera testnet`)
      console.log(`🆔 Agent ID: ${process.env.SETTLEMENT_AGENT_ID}`)
      console.log(`📡 Topic ID: ${topicId}`)
      console.log(`🌐 RPC URL: ${process.env.BASE_RPC_URL}`)
    } catch (error) {
      console.error('❌ Failed to initialize SettlementAgent:', error)
      throw error
    }
  }

  private startMessagePolling(topicId: string): void {
    // Poll for messages every 5 seconds
    setInterval(async () => {
      try {
        const result = await this.hcsClient.getMessages(topicId)
        if (result.messages && result.messages.length > 0) {
          console.log(chalk.yellow(`📨 Found ${result.messages.length} new message(s)`))
          for (const message of result.messages) {
            await this.handleMessage(message)
          }
        }
      } catch (error) {
        console.error('❌ Error polling for messages:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  private async handleMessage(message: any): Promise<void> {
    try {
      // Parse message.contents
      const parsed = JSON.parse(message.contents || message.data || '{}')

      // If type === 'verification_result' && approved
      if (parsed.type === 'verification_result' && parsed.approved) {
        console.log(chalk.yellow('Settlement approved'))
        await this.executeSettlement(parsed)
      }
    } catch (error) {
      console.error('❌ Error handling message:', error)
    }
  }

  private createHederaRequirements() {
    const hbarAmount = parseFloat(process.env.HBAR_PAYMENT_AMOUNT || '10')
    const tinybarAmount = hbarAmount * 100_000_000 // Convert HBAR to tinybars
    
    return {
      scheme: 'exact' as const,
      network: 'hedera-testnet' as any, // Type cast for Hedera support from X402 PR #448
      asset: 'HBAR',
      payTo: process.env.HEDERA_MERCHANT_ACCOUNT_ID || '',
      maxAmountRequired: tinybarAmount.toString(),
      resource: '/agent-settlement',
      description: 'A2A agent settlement via Hedera',
      mimeType: 'application/json',
      maxTimeoutSeconds: 120
    }
  }

  private createBaseRequirements() {
    return {
      scheme: 'exact' as const,
      network: 'base-sepolia' as const,
      asset: process.env.USDC_CONTRACT || '',
      payTo: process.env.MERCHANT_WALLET_ADDRESS || '',
      maxAmountRequired: '1000000', // 1 USDC
      resource: '/agent-settlement',
      description: 'A2A agent settlement',
      mimeType: 'application/json',
      maxTimeoutSeconds: 120
    }
  }

  private createPaymentRequirements() {
    if (this.paymentNetwork === 'hedera-testnet') {
      return this.createHederaRequirements()
    } else {
      return this.createBaseRequirements()
    }
  }

  private async executeSettlement(verification: any): Promise<void> {
    try {
      console.log(chalk.yellow(`Initiating settlement flow on ${this.paymentNetwork}...`))

      if (this.paymentNetwork === 'hedera-testnet') {
        // Direct Hedera HBAR transfer (bypass X402 for now)
        await this.executeHederaSettlement(verification)
      } else {
        // Standard X402 flow for Base USDC
        await this.executeX402Settlement(verification)
      }

    } catch (error) {
      console.error('❌ Error executing settlement:', error)
      throw error // Fail entire settlement if any step fails (strict error handling)
    }
  }

  private async executeX402Settlement(verification: any): Promise<void> {
    // Step 1: Create payment requirements based on network
    const requirements = this.createPaymentRequirements()

    // Step 2: Create payment authorization
    console.log(chalk.blue('📋 Step 1: Creating payment authorization...'))
    const paymentPayload = await processPayment(requirements as any, this.wallet)
    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

    // Debug: Log the actual paymentPayload structure
    console.log(chalk.blue('📋 Payment payload structure:'), JSON.stringify(paymentPayload, null, 2))

    // Step 3: Verify payment via facilitator
    console.log(chalk.blue('📋 Step 2: Verifying payment...'))
    const verificationResult = await this.facilitator.verify(paymentHeader, requirements)
    
    if (!verificationResult.isValid) {
      throw new Error(`Payment verification failed: ${verificationResult.invalidReason}`)
    }
    console.log(chalk.green('✅ Payment verification successful'))

    // Step 4: Settle payment via facilitator (executes actual USDC transfer)
    console.log(chalk.blue('📋 Step 3: Settling payment and executing USDC transfer...'))
    const settlementResult = await this.facilitator.settle(paymentHeader, requirements)
    
    if (!settlementResult.success) {
      throw new Error(`Payment settlement failed: ${settlementResult.error}`)
    }
    
    console.log(chalk.green('✅ Payment settled successfully!'))
    console.log(chalk.blue(`📋 Transaction Hash: ${settlementResult.txHash}`))
    console.log(chalk.blue(`📋 Network: ${settlementResult.networkId}`))
    console.log(chalk.blue(`📋 Amount: 1 USDC`))

    // Step 5: Record settlement with actual transaction hash
    await this.recordSettlement(settlementResult.txHash!, 1)
  }

  private async executeHederaSettlement(verification: any): Promise<void> {
    if (!this.hederaClient) {
      throw new Error('Hedera client not initialized')
    }

    console.log(chalk.blue('📋 Step 1: Querying account balance...'))
    const operatorId = this.hederaClient.operatorAccountId!
    const balanceQuery = await new AccountBalanceQuery().setAccountId(operatorId).execute(this.hederaClient)
    const balanceInHBAR = balanceQuery.hbars.toString()
    console.log(chalk.blue(`📋 Current balance: ${balanceInHBAR}`))

    const merchantAccountId = process.env.HEDERA_MERCHANT_ACCOUNT_ID
    if (!merchantAccountId) {
      throw new Error('Missing HEDERA_MERCHANT_ACCOUNT_ID environment variable')
    }

    const hbarAmount = parseFloat(process.env.HBAR_PAYMENT_AMOUNT || '10')
    const tinybarAmount = hbarAmount * 100_000_000

    console.log(chalk.blue('📋 Step 2: Creating HBAR transfer transaction...'))
    console.log(chalk.blue(`📋 Amount: ${hbarAmount} HBAR (${tinybarAmount} tinybars)`))
    console.log(chalk.blue(`📋 From: ${operatorId.toString()}`))
    console.log(chalk.blue(`📋 To: ${merchantAccountId}`))

    console.log(chalk.blue('📋 Step 3: Executing HBAR transfer...'))
    
    // Create and execute transfer
    const transfer = new TransferTransaction()
      .addHbarTransfer(operatorId, Hbar.fromTinybars(-tinybarAmount))
      .addHbarTransfer(AccountId.fromString(merchantAccountId), Hbar.fromTinybars(tinybarAmount))
      .setTransactionMemo('A2A agent settlement')

    const txResponse = await transfer.execute(this.hederaClient)
    const receipt = await txResponse.getReceipt(this.hederaClient)

    console.log(chalk.green('✅ HBAR transfer confirmed'))
    console.log(chalk.blue(`📋 Transaction ID: ${txResponse.transactionId.toString()}`))
    console.log(chalk.blue(`📋 Status: ${receipt.status.toString()}`))
    console.log(chalk.blue(`📋 Amount: ${hbarAmount} HBAR`))

    // Record settlement
    await this.recordSettlement(txResponse.transactionId.toString(), hbarAmount)
  }

  private async recordSettlement(txHash: string, amount: number): Promise<void> {
    try {
      // Create settlement object
      const asset = this.paymentNetwork === 'hedera-testnet' ? 'HBAR' : 'USDC'
      const settlement = {
        type: 'settlement_complete',
        txHash,
        amount: `${amount} ${asset}`,
        network: this.paymentNetwork,
        timestamp: Date.now()
      }

      // Send via hcsClient.sendMessage to ANALYZER_TOPIC_ID (broadcast)
      const analyzerTopicId = process.env.ANALYZER_TOPIC_ID
      if (!analyzerTopicId) {
        console.warn(chalk.yellow('⚠️ Missing ANALYZER_TOPIC_ID - skipping HCS recording'))
        return
      }

      await this.hcsClient.sendMessage(analyzerTopicId, JSON.stringify(settlement))
      console.log(chalk.green('✅ Settlement recorded via HCS'))
    } catch (error) {
      console.warn(chalk.yellow('⚠️ HCS communication failed (non-critical):'), (error as Error).message)
      console.log(chalk.blue('💡 Settlement completed successfully despite HCS communication issue'))
      // Don't throw error - settlement was successful, HCS is just for coordination
    }
  }

  /**
   * Get connection manager instance (if initialized)
   */
  getConnectionManager(): HCS10ConnectionManager | undefined {
    return this.connectionManager
  }

  /**
   * Get transaction approval manager instance (if initialized)
   */
  getTransactionApproval(): HCS10TransactionApproval | undefined {
    return this.transactionApproval
  }

  getHcsClient(): HCS10Client {
    return this.hcsClient
  }
}
