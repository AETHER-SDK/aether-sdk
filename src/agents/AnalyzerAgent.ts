import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { Client, AccountInfoQuery, AccountId } from '@hashgraph/sdk'
import { HCS10ConnectionManager } from '../protocols/HCS10ConnectionManager'
import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export class AnalyzerAgent {
  private hcsClient: HCS10Client
  private hederaClient: Client
  private connectionManager?: HCS10ConnectionManager
  private readonly MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com'

  constructor() {
    // Get agent credentials from environment variables
    const agentId = process.env.ANALYZER_AGENT_ID
    const privateKey = process.env.ANALYZER_PRIVATE_KEY

    if (!agentId || !privateKey) {
      throw new Error('Missing required environment variables: ANALYZER_AGENT_ID and ANALYZER_PRIVATE_KEY')
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
      
      this.hederaClient = Client.forTestnet()
      this.hederaClient.setOperator(AccountId.fromString(mainAccountId), mainPrivateKey)
      
      // Initialize HCS10Client with main account for now
      this.hcsClient = new HCS10Client(mainAccountId, mainPrivateKey, 'testnet')
      
      // Initialize connection manager (optional)
      const useConnections = process.env.USE_HCS10_CONNECTIONS === 'true'
      if (useConnections) {
        this.connectionManager = new HCS10ConnectionManager(this.hcsClient, mainAccountId)
      }
    } else {
      // Initialize HCS10Client with actual agent credentials
      this.hcsClient = new HCS10Client(agentId, privateKey, 'testnet')
      
      // Also initialize Hedera client for direct queries
      this.hederaClient = Client.forTestnet()
      this.hederaClient.setOperator(AccountId.fromString(agentId), privateKey)
      
      // Initialize connection manager (optional)
      const useConnections = process.env.USE_HCS10_CONNECTIONS === 'true'
      if (useConnections) {
        this.connectionManager = new HCS10ConnectionManager(this.hcsClient, agentId)
      }
    }
  }

  async init(): Promise<void> {
    try {
      // Log initialization success
      console.log('🔗 AnalyzerAgent initialized for Hedera testnet')
      console.log(`📡 Mirror node URL: ${this.MIRROR_NODE_URL}`)
      console.log(`🆔 Agent ID: ${process.env.ANALYZER_AGENT_ID}`)
      
      // Test connection by querying our own account
      const agentId = process.env.ANALYZER_AGENT_ID
      if (agentId) {
        try {
          const accountInfo = await this.queryAccount(agentId)
          console.log(`✅ Agent account verified: ${accountInfo.balance} tinybars`)
        } catch (error) {
          console.warn(`⚠️  Could not verify agent account ${agentId}:`, (error as Error).message)
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize AnalyzerAgent:', error)
      throw error
    }
  }

  async queryAccount(accountId: string): Promise<any> {
    try {
      console.log(`🔍 Querying account: ${accountId}`)
      
      // Query account info using Hedera SDK
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(this.hederaClient)
      
      console.log(`✅ Account ${accountId} found`)
      console.log(`💰 Balance: ${accountInfo.balance} tinybars`)
      console.log(`🔑 Key: ${accountInfo.key?.toString()}`)
      
      return {
        accountId: accountId,
        balance: accountInfo.balance.toString(),
        key: accountInfo.key?.toString(),
        isDeleted: accountInfo.isDeleted,
        autoRenewPeriod: accountInfo.autoRenewPeriod?.toString()
      }
    } catch (error) {
      console.error(`❌ Failed to query account ${accountId}:`, error)
      throw error
    }
  }

  async queryAccountViaMirror(accountId: string): Promise<any> {
    try {
      console.log(`🔍 Querying account via mirror node: ${accountId}`)
      
      const response = await axios.get(`${this.MIRROR_NODE_URL}/api/v1/accounts/${accountId}`)
      
      console.log(`✅ Account ${accountId} found via mirror node`)
      console.log(`💰 Balance: ${response.data.balance?.balance} tinybars`)
      
      return response.data
    } catch (error) {
      console.error(`❌ Failed to query account ${accountId} via mirror node:`, error)
      throw error
    }
  }

  getHcsClient(): HCS10Client {
    return this.hcsClient
  }

  /**
   * Get connection manager instance (if initialized)
   */
  getConnectionManager(): HCS10ConnectionManager | undefined {
    return this.connectionManager
  }
}
