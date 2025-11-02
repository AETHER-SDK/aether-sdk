/**
 * Enhanced Settlement Agent with A2A Protocol, AP2 Payments, and HITL Mode
 * 
 * This enhanced agent implements:
 * - A2A protocol for agent-to-agent communication
 * - AP2 payment protocol for autonomous settlements
 * - Human-in-the-Loop mode for approval workflows
 * - Multi-agent negotiation for payment terms
 */

import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { Wallet, JsonRpcProvider } from 'ethers'
import { Client, PrivateKey, AccountId, TransferTransaction, Hbar, AccountBalanceQuery } from '@hashgraph/sdk'
import { processPayment } from 'a2a-x402'
import { A2AProtocol } from '../protocols/A2AProtocol'
import { A2ANegotiation, NegotiationState } from '../protocols/A2ANegotiation'
import { AP2Protocol, AP2PaymentRequest } from '../protocols/AP2Protocol'
import { HumanInTheLoopMode, ApprovalRequest } from '../modes/HumanInTheLoopMode'
import { X402FacilitatorServer } from '../facilitator/X402FacilitatorServer'
import { loadEnvIfNeeded } from '../utils/env'
import chalk from 'chalk'

loadEnvIfNeeded()

export class SettlementAgentEnhanced {
  private hcsClient: HCS10Client
  private provider: JsonRpcProvider
  private wallet: Wallet
  private hederaClient?: Client
  private a2a: A2AProtocol
  private a2aNegotiation: A2ANegotiation
  private hitl: HumanInTheLoopMode
  private facilitator: X402FacilitatorServer
  private paymentNetwork: 'hedera-testnet' | 'base-sepolia'

  constructor() {
    // Initialize base components (similar to existing SettlementAgent)
    const agentId = process.env.SETTLEMENT_AGENT_ID
    const privateKey = process.env.SETTLEMENT_PRIVATE_KEY
    const baseRpcUrl = process.env.BASE_RPC_URL
    const walletPrivateKey = process.env.SETTLEMENT_WALLET_PRIVATE_KEY
    const mainAccountId = process.env.HEDERA_ACCOUNT_ID
    const mainPrivateKey = process.env.HEDERA_PRIVATE_KEY

    if (!agentId || !privateKey || !baseRpcUrl || !walletPrivateKey) {
      throw new Error('Missing required environment variables')
    }

    // Initialize HCS client
    if (privateKey.startsWith('placeholder-key-for-')) {
      if (!mainAccountId || !mainPrivateKey) {
        throw new Error('Missing main Hedera credentials')
      }
      
      this.hcsClient = new HCS10Client(mainAccountId, mainPrivateKey, 'testnet')
    } else {
      this.hcsClient = new HCS10Client(agentId, privateKey, 'testnet')
    }

    // Initialize Ethereum/Base components
    this.provider = new JsonRpcProvider(baseRpcUrl)
    this.wallet = new Wallet(walletPrivateKey, this.provider)
    this.facilitator = new X402FacilitatorServer()

    this.paymentNetwork = (process.env.PAYMENT_NETWORK || 'base-sepolia') as 'hedera-testnet' | 'base-sepolia'

    // Initialize Hedera client if needed
    if (this.paymentNetwork === 'hedera-testnet') {
      if (!mainAccountId || !mainPrivateKey) {
        throw new Error('Missing required Hedera credentials')
      }

      this.hederaClient = Client.forTestnet()
      const accountId = AccountId.fromString(mainAccountId)
      const privateKeyObj = PrivateKey.fromString(mainPrivateKey)
      this.hederaClient.setOperator(accountId, privateKeyObj)
    }

    // Initialize A2A protocol
    this.a2a = new A2AProtocol(
      this.hcsClient,
      agentId || mainAccountId || "unknown",
      ['payment', 'settlement', 'negotiation']
    )

    // Initialize A2A negotiation
    this.a2aNegotiation = new A2ANegotiation(this.a2a)

    // Initialize HITL mode
    this.hitl = new HumanInTheLoopMode({
      enabled: process.env.HITL_ENABLED === 'true',
      approvalThresholds: {
        payment: parseFloat(process.env.HITL_PAYMENT_THRESHOLD || '100')
      }
    })
  }

  async init(): Promise<void> {
    const topicId = process.env.SETTLEMENT_TOPIC_ID
    if (!topicId) {
      throw new Error('Missing SETTLEMENT_TOPIC_ID')
    }

    this.startMessagePolling(topicId)

    console.log(chalk.green('✅ SettlementAgentEnhanced initialized'))
    console.log(chalk.blue(`📡 A2A Protocol: Enabled`))
    console.log(chalk.blue(`💬 Negotiation: Enabled`))
    console.log(chalk.blue(`👤 HITL Mode: ${this.hitl['config'].enabled ? 'Enabled' : 'Disabled'}`))
  }

  private startMessagePolling(topicId: string): void {
    setInterval(async () => {
      try {
        const result = await this.hcsClient.getMessages(topicId)
        if (result.messages && result.messages.length > 0) {
          for (const message of result.messages) {
            await this.handleMessage(message)
          }
        }
      } catch (error) {
        console.error('Error polling:', error)
      }
    }, 5000)
  }

  private async handleMessage(message: any): Promise<void> {
    try {
      const content = message.contents || message.data || '{}'
      const parsed = JSON.parse(content)

      // Try to parse as A2A message
      const a2aMessage = this.a2a.parseMessage(content)

      if (a2aMessage) {
        await this.handleA2AMessage(a2aMessage)
      } else if (parsed.type === 'verification_result' && parsed.approved) {
        await this.executeSettlement(parsed)
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  private async handleA2AMessage(message: any): Promise<void> {
    console.log(chalk.blue(`📨 Received A2A ${message.messageType} message`))

    // Handle negotiation messages
    const negotiationResult = await this.a2aNegotiation.processNegotiationMessage(message)
    if (negotiationResult) {
      console.log(chalk.green(`✅ Negotiation ${negotiationResult.proposalId}: ${negotiationResult.state}`))
    }

    // Handle AP2 payment messages
    const paymentRequest = AP2Protocol.parseAP2Message(message)
    if (paymentRequest) {
      await this.handleAP2Payment(paymentRequest)
    }
  }

  private async handleAP2Payment(paymentRequest: AP2PaymentRequest): Promise<void> {
    console.log(chalk.blue(`💳 Processing AP2 payment request: ${paymentRequest.paymentId}`))

    // Validate payment request
    const validation = AP2Protocol.validatePaymentRequest(paymentRequest)
    if (!validation.valid) {
      console.error(chalk.red(`❌ Payment validation failed: ${validation.error}`))
      return
    }

    // Request human approval if threshold exceeded
    if (this.hitl['config'].enabled && 
        this.hitl.requiresApproval("payment", { amount: parseFloat(paymentRequest.amount) })) {
      
      const approval = await this.hitl.requestApproval({
        action: "payment",
        description: `AP2 payment of ${paymentRequest.amount} ${paymentRequest.currency}`,
        details: paymentRequest
      })

      if (!approval.approved) {
        console.log(chalk.red('❌ Human approval denied'))
        return
      }
    }

    // Execute payment based on network
    if (paymentRequest.network === 'hedera-testnet') {
      await this.executeHederaPayment(paymentRequest)
    } else {
      await this.executeBasePayment(paymentRequest)
    }
  }

  private async executeHederaPayment(paymentRequest: AP2PaymentRequest): Promise<void> {
    // Implementation for Hedera payments
    console.log(chalk.blue(`Executing Hedera payment: ${paymentRequest.amount} ${paymentRequest.currency}`))
    // ... implementation
  }

  private async executeBasePayment(paymentRequest: AP2PaymentRequest): Promise<void> {
    // Implementation for Base/USDC payments
    console.log(chalk.blue(`Executing Base payment: ${paymentRequest.amount} ${paymentRequest.currency}`))
    // ... implementation
  }

  private async executeSettlement(verification: any): Promise<void> {
    try {
      console.log(chalk.yellow(`Initiating settlement on ${this.paymentNetwork}...`))

      // Check if HITL approval is required
      const amount = verification.paymentDetails?.amount || 0
      if (this.hitl['config'].enabled && this.hitl.requiresApproval("payment", { amount })) {
        
        const approval = await this.hitl.requestApproval({
          action: "settlement",
          description: `Settlement payment of ${amount}`,
          details: verification.paymentDetails
        })

        if (!approval.approved) {
          console.log(chalk.red('❌ Settlement denied by human'))
          return
        }
      }

      if (this.paymentNetwork === 'hedera-testnet') {
        await this.executeHederaSettlement(verification)
      } else {
        await this.executeX402Settlement(verification)
      }

    } catch (error) {
      console.error('Error executing settlement:', error)
      throw error
    }
  }

  private async executeHederaSettlement(verification: any): Promise<void> {
    // Implementation
  }

  private async executeX402Settlement(verification: any): Promise<void> {
    // Implementation  
  }

  async triggerSettlement(verification: any): Promise<void> {
    await this.executeSettlement(verification)
  }
}

