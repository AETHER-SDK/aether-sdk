import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { HCS10ConnectionManager } from '../protocols/HCS10ConnectionManager'
import { HCS10TransactionApproval } from '../protocols/HCS10TransactionApproval'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export class VerifierAgent {
  private hcsClient: HCS10Client
  private messageHandlers: Map<string, Function>
  private connectionManager?: HCS10ConnectionManager
  private transactionApproval?: HCS10TransactionApproval

  constructor() {
    // Get agent credentials from environment variables
    const agentId = process.env.VERIFIER_AGENT_ID
    const privateKey = process.env.VERIFIER_PRIVATE_KEY

    if (!agentId || !privateKey) {
      throw new Error('Missing required environment variables: VERIFIER_AGENT_ID and VERIFIER_PRIVATE_KEY')
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

    // Initialize message handlers map
    this.messageHandlers = new Map()
  }

  async init(): Promise<void> {
    try {
      // Get topic ID from environment
      const topicId = process.env.VERIFIER_TOPIC_ID
      if (!topicId) {
        throw new Error('Missing required environment variable: VERIFIER_TOPIC_ID')
      }

      console.log(chalk.green('VerifierAgent initialized and ready to process messages'))
      console.log(`🔗 VerifierAgent initialized for Hedera testnet`)
      console.log(`🆔 Agent ID: ${process.env.VERIFIER_AGENT_ID}`)
      console.log(`📡 Topic ID: ${topicId}`)
      console.log(`🔄 Polling for messages every 5 seconds...`)
      
      // Start polling for messages
      this.startMessagePolling(topicId)
    } catch (error) {
      console.error('❌ Failed to initialize VerifierAgent:', error)
      throw error
    }
  }

  private startMessagePolling(topicId: string): void {
    // Poll for messages every 5 seconds
    setInterval(async () => {
      try {
        const result = await this.hcsClient.getMessages(topicId)
        if (result.messages && result.messages.length > 0) {
          console.log(chalk.green(`📨 Found ${result.messages.length} new message(s)`))
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
      // Parse message.contents as JSON (HCS10Client returns messages with contents field)
      const parsed = JSON.parse(message.contents || message.data || '{}')
      
      // Log received message type
      console.log(chalk.green(`Received message type: ${parsed.type}`))
      
      // Handle different message types
      if (parsed.type === 'analysis_proposal') {
        await this.validateProposal(parsed)
      } else {
        // Check for custom handlers
        const handler = this.messageHandlers.get(parsed.type)
        if (handler) {
          await handler(parsed)
        } else {
          console.log(`No handler registered for message type: ${parsed.type}`)
        }
      }
    } catch (error) {
      console.error('❌ Error handling message:', error)
    }
  }

  private async validateProposal(proposal: any): Promise<void> {
    try {
      console.log(chalk.green('Validating proposal...'))
      
      // Simple validation: approved = proposal.meetsThreshold
      const approved = proposal.meetsThreshold || false
      
      // Create result object
      const result = {
        type: 'verification_result',
        originalProposal: proposal,
        approved: approved,
        reasoning: approved 
          ? `Proposal approved: meets threshold requirements (${proposal.meetsThreshold})`
          : `Proposal rejected: does not meet threshold requirements (${proposal.meetsThreshold})`,
        timestamp: Date.now()
      }

      if (approved) {
        console.log(chalk.green('✓ Approved'))
        
        // Send result via hcsClient.sendMessage to SETTLEMENT_TOPIC_ID
        const settlementTopicId = process.env.SETTLEMENT_TOPIC_ID
        if (!settlementTopicId) {
          throw new Error('Missing required environment variable: SETTLEMENT_TOPIC_ID')
        }
        
        await this.hcsClient.sendMessage(settlementTopicId, JSON.stringify(result))
        console.log(`📤 Verification result sent to settlement topic: ${settlementTopicId}`)
      } else {
        console.log(chalk.yellow('✗ Rejected'))
      }

      // Result is sent via HCS message, no need to return
    } catch (error) {
      console.error('❌ Error validating proposal:', error)
      throw error
    }
  }

  /**
   * Register custom message handlers for specific message types
   * @param type - The message type to handle
   * @param handler - The handler function to call when this message type is received
   */
  onMessage(type: string, handler: Function): void {
    this.messageHandlers.set(type, handler)
    console.log(`📝 Registered handler for message type: ${type}`)
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
