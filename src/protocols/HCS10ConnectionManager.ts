/**
 * HCS-10 Connection Management Module
 * 
 * Manages HCS-10 OpenConvAI agent connections including:
 * - Connection requests and establishment
 * - Connection monitoring
 * - Connection lifecycle management
 * - Fee-based connections
 */

import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { FeeConfig, HCS10FeeConfig } from './HCS10FeeConfig'
import chalk from 'chalk'

/**
 * Connection state
 */
export interface Connection {
  connectionId: string
  agentId: string
  connectionTopicId: string
  status: 'pending' | 'established' | 'closed' | 'rejected'
  createdAt: number
  establishedAt?: number
  closedAt?: number
}

/**
 * Connection options
 */
export interface ConnectionOptions {
  timeout?: number // milliseconds
  retryAttempts?: number
  metadata?: Record<string, any>
}

/**
 * Connection callback for monitoring incoming requests
 */
export interface ConnectionCallback {
  onConnectionRequest?: (request: ConnectionRequest) => Promise<boolean> // Return true to accept
  onConnectionEstablished?: (connection: Connection) => Promise<void>
  onConnectionRejected?: (request: ConnectionRequest) => Promise<void>
  onConnectionClosed?: (connection: Connection) => Promise<void>
}

/**
 * Connection request details
 */
export interface ConnectionRequest {
  fromAgentId: string
  timestamp: number
  metadata?: Record<string, any>
  feePaid?: boolean
}

/**
 * HCS-10 Connection Manager
 * 
 * Manages agent connections according to HCS-10 OpenConvAI protocol
 */
export class HCS10ConnectionManager {
  private hcsClient: HCS10Client
  private agentId: string
  private connections: Map<string, Connection> = new Map()
  private monitoringActive: boolean = false

  constructor(hcsClient: HCS10Client, agentId: string) {
    this.hcsClient = hcsClient
    this.agentId = agentId
  }

  /**
   * Request a connection to another agent
   */
  async requestConnection(
    targetAgentId: string,
    options?: ConnectionOptions
  ): Promise<Connection> {
    try {
      console.log(chalk.blue(`📡 Requesting connection to agent: ${targetAgentId}`))

      // Check if connection already exists
      const existingConnection = this.getConnection(targetAgentId)
      if (existingConnection && existingConnection.status === 'established') {
        console.log(chalk.yellow(`⚠️  Connection already established with ${targetAgentId}`))
        return existingConnection
      }

      // Get target agent's inbound topic ID from their profile
      // For now, we'll use a message-based approach to request connection
      // In full HCS-10, we'd use the SDK's connection request methods
      
      // Create connection request message
      const connectionRequest = {
        type: 'connection_request',
        from: this.agentId,
        to: targetAgentId,
        timestamp: Date.now(),
        metadata: options?.metadata || {}
      }

      // Get target agent's inbound topic (in real implementation, fetch from profile/registry)
      // For now, we'll assume it's provided or stored
      // This is a placeholder - actual implementation would use SDK connection methods
      const targetInboundTopicId = process.env[`${targetAgentId.toUpperCase().replace(/\./g, '_')}_TOPIC_ID`] 
        || process.env[`${targetAgentId}_INBOUND_TOPIC_ID`]

      if (!targetInboundTopicId) {
        throw new Error(`Cannot find inbound topic for agent ${targetAgentId}`)
      }

      // Send connection request
      await this.hcsClient.sendMessage(
        targetInboundTopicId,
        JSON.stringify(connectionRequest)
      )

      // Create pending connection
      const connection: Connection = {
        connectionId: `conn_${Date.now()}_${targetAgentId}`,
        agentId: targetAgentId,
        connectionTopicId: '', // Will be set when connection is established
        status: 'pending',
        createdAt: Date.now()
      }

      this.connections.set(targetAgentId, connection)
      console.log(chalk.yellow(`⏳ Connection request sent, waiting for confirmation...`))

      // Wait for connection confirmation (with timeout)
      const timeout = options?.timeout || 60000 // 60 seconds default
      const connectionEstablished = await this.waitForConnectionConfirmation(
        targetAgentId,
        timeout
      )

      if (connectionEstablished) {
        connection.status = 'established'
        connection.establishedAt = Date.now()
        // In full implementation, connectionTopicId would come from SDK response
        // For now, we'll use a derived topic ID
        connection.connectionTopicId = `connection_${this.agentId}_${targetAgentId}`
        console.log(chalk.green(`✅ Connection established with ${targetAgentId}`))
      } else {
        throw new Error(`Connection request timed out after ${timeout}ms`)
      }

      return connection
    } catch (error) {
      console.error(chalk.red(`❌ Failed to establish connection: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Monitor incoming connection requests
   */
  async monitorIncomingRequests(
    inboundTopicId: string,
    feeConfig?: FeeConfig,
    callback?: ConnectionCallback
  ): Promise<void> {
    if (this.monitoringActive) {
      console.log(chalk.yellow('⚠️  Already monitoring incoming requests'))
      return
    }

    console.log(chalk.blue(`👂 Monitoring for incoming connection requests on topic: ${inboundTopicId}`))
    if (feeConfig && feeConfig.hbarFee) {
      console.log(chalk.blue(`💰 Connection fee required: ${feeConfig.hbarFee} HBAR`))
    }

    this.monitoringActive = true

    // Start polling for connection requests
    // In full implementation, this would use SDK's message subscription
    this.startConnectionMonitoring(inboundTopicId, feeConfig, callback)
  }

  /**
   * Get connection by agent ID
   */
  getConnection(agentId: string): Connection | null {
    return this.connections.get(agentId) || null
  }

  /**
   * Get all established connections
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'established')
  }

  /**
   * Close a connection
   */
  async closeConnection(agentId: string): Promise<void> {
    const connection = this.connections.get(agentId)
    if (!connection) {
      throw new Error(`No connection found for agent ${agentId}`)
    }

    if (connection.status === 'closed') {
      console.log(chalk.yellow(`⚠️  Connection already closed`))
      return
    }

    // Send connection close message
    const closeMessage = {
      type: 'connection_close',
      from: this.agentId,
      to: agentId,
      timestamp: Date.now()
    }

    // Send to connection topic if available
    if (connection.connectionTopicId) {
      await this.hcsClient.sendMessage(
        connection.connectionTopicId,
        JSON.stringify(closeMessage)
      )
    }

    connection.status = 'closed'
    connection.closedAt = Date.now()

    console.log(chalk.blue(`🔌 Connection closed with ${agentId}`))
  }

  /**
   * Wait for connection confirmation
   */
  private async waitForConnectionConfirmation(
    agentId: string,
    timeout: number
  ): Promise<boolean> {
    const startTime = Date.now()
    const checkInterval = 1000 // Check every second

    while (Date.now() - startTime < timeout) {
      const connection = this.connections.get(agentId)
      if (connection && connection.status === 'established') {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }

    return false
  }

  /**
   * Start monitoring for connection requests
   */
  private async startConnectionMonitoring(
    inboundTopicId: string,
    feeConfig?: FeeConfig,
    callback?: ConnectionCallback
  ): Promise<void> {
    // This is a simplified polling implementation
    // In production, use SDK's message subscription features
    const pollInterval = 5000 // Poll every 5 seconds

    const poll = async () => {
      if (!this.monitoringActive) return

      try {
        // Get messages from topic
        // Note: This assumes HCS10Client has a method to get messages
        // If not available, we'll need to implement polling differently
        
        // For now, this is a placeholder that would be implemented
        // using the SDK's actual message retrieval methods
        
        setTimeout(poll, pollInterval)
      } catch (error) {
        console.error(chalk.red(`❌ Error monitoring connections: ${(error as Error).message}`))
        if (this.monitoringActive) {
          setTimeout(poll, pollInterval)
        }
      }
    }

    await poll()
  }

  /**
   * Stop monitoring for connections
   */
  stopMonitoring(): void {
    this.monitoringActive = false
    console.log(chalk.blue(`🛑 Stopped monitoring connection requests`))
  }
}

