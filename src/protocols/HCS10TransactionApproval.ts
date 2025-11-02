/**
 * HCS-10 Transaction Approval Module
 * 
 * Manages transaction approval workflows using Hedera Scheduled Transactions.
 * Supports multi-signature transactions requiring approval before execution.
 */

import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { Transaction, ScheduleCreateTransaction, ScheduleSignTransaction, ScheduleId, TransactionReceipt, Hbar, Timestamp } from '@hashgraph/sdk'
import chalk from 'chalk'

/**
 * Transaction options for scheduling
 */
export interface TransactionOptions {
  scheduleMemo?: string
  expirationTime?: number // seconds
  adminKey?: any
  maxTransactionFee?: Hbar
}

/**
 * Scheduled transaction result
 */
export interface ScheduledTransaction {
  scheduleId: ScheduleId
  transactionId: string
  status: 'pending' | 'executed' | 'expired' | 'rejected'
  createdAt: number
  expirationTime?: number
  requiredSignatures: number
  currentSignatures: number
}

/**
 * Pending transaction information
 */
export interface PendingTransaction {
  scheduleId: ScheduleId
  description: string
  transactionType: string
  createdAt: number
  expirationTime?: number
  requiredSignatures: number
  currentSignatures: number
  scheduleMemo?: string
}

/**
 * HCS-10 Transaction Approval Manager
 * 
 * Manages scheduled transactions requiring approval
 */
export class HCS10TransactionApproval {
  private hcsClient: HCS10Client
  private agentId: string
  private pendingTransactions: Map<string, ScheduledTransaction> = new Map()

  constructor(hcsClient: HCS10Client, agentId: string) {
    this.hcsClient = hcsClient
    this.agentId = agentId
  }

  /**
   * Send a transaction for approval via connection topic
   */
  async sendTransaction(
    connectionTopicId: string,
    transaction: Transaction,
    description: string,
    options?: TransactionOptions
  ): Promise<ScheduledTransaction> {
    try {
      console.log(chalk.blue(`📋 Scheduling transaction for approval: ${description}`))

      // Create scheduled transaction
      const scheduledTx = new ScheduleCreateTransaction()
        .setScheduledTransaction(transaction)
        .setScheduleMemo(options?.scheduleMemo || description)

      if (options?.expirationTime) {
        // Set expiration time (in seconds from now)
        const expirationDate = new Date(Date.now() + options.expirationTime * 1000)
        const expirationTimestamp = Timestamp.fromDate(expirationDate)
        scheduledTx.setExpirationTime(expirationTimestamp)
      }

      if (options?.adminKey) {
        scheduledTx.setAdminKey(options.adminKey)
      }

      if (options?.maxTransactionFee) {
        scheduledTx.setMaxTransactionFee(options.maxTransactionFee)
      }

      // Execute the schedule creation
      // Note: This requires access to the underlying Hedera client
      // We'll need to get it from HCS10Client or pass it separately
      const client = (this.hcsClient as any).getClient?.() || (this.hcsClient as any).client
      
      if (!client) {
        throw new Error('Cannot access Hedera client to schedule transaction')
      }

      const response = await scheduledTx.execute(client)
      const receipt = await response.getReceipt(client)
      
      if (!receipt.scheduleId) {
        throw new Error('Schedule ID not returned from transaction')
      }

      const scheduledTransaction: ScheduledTransaction = {
        scheduleId: receipt.scheduleId,
        transactionId: response.transactionId.toString(),
        status: 'pending',
        createdAt: Date.now(),
        ...(options?.expirationTime && { expirationTime: Date.now() + options.expirationTime * 1000 }),
        requiredSignatures: 2, // Default to 2 signatures (sender + approver)
        currentSignatures: 1 // Sender has already signed
      }

      this.pendingTransactions.set(receipt.scheduleId.toString(), scheduledTransaction)

      // Send transaction notification to connection topic
      const transactionNotification = {
        type: 'transaction_for_approval',
        scheduleId: receipt.scheduleId.toString(),
        description,
        transactionId: response.transactionId.toString(),
        createdAt: scheduledTransaction.createdAt,
        expirationTime: scheduledTransaction.expirationTime,
        memo: options?.scheduleMemo || description
      }

      await this.hcsClient.sendMessage(
        connectionTopicId,
        JSON.stringify(transactionNotification)
      )

      console.log(chalk.green(`✅ Transaction scheduled: ${receipt.scheduleId.toString()}`))
      console.log(chalk.blue(`📋 Waiting for approval on connection topic: ${connectionTopicId}`))

      return scheduledTransaction
    } catch (error) {
      console.error(chalk.red(`❌ Failed to schedule transaction: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Approve a scheduled transaction
   */
  async approveTransaction(scheduleId: ScheduleId | string): Promise<TransactionReceipt> {
    try {
      const scheduleIdObj = typeof scheduleId === 'string' 
        ? ScheduleId.fromString(scheduleId)
        : scheduleId

      console.log(chalk.blue(`✅ Approving transaction: ${scheduleIdObj.toString()}`))

      // Create schedule sign transaction
      const signTx = new ScheduleSignTransaction()
        .setScheduleId(scheduleIdObj)

      // Get Hedera client
      const client = (this.hcsClient as any).getClient?.() || (this.hcsClient as any).client
      
      if (!client) {
        throw new Error('Cannot access Hedera client to approve transaction')
      }

      // Execute the signature
      const response = await signTx.execute(client)
      const receipt = await response.getReceipt(client)

      // Update pending transaction status
      const pendingTx = this.pendingTransactions.get(scheduleIdObj.toString())
      if (pendingTx) {
        pendingTx.currentSignatures++
        if (pendingTx.currentSignatures >= pendingTx.requiredSignatures) {
          pendingTx.status = 'executed'
          console.log(chalk.green(`✅ Transaction approved and executed`))
        } else {
          console.log(chalk.yellow(`⏳ Transaction approved (${pendingTx.currentSignatures}/${pendingTx.requiredSignatures} signatures)`))
        }
      }

      return receipt
    } catch (error) {
      console.error(chalk.red(`❌ Failed to approve transaction: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Reject a scheduled transaction
   */
  async rejectTransaction(scheduleId: ScheduleId | string, reason?: string): Promise<void> {
    try {
      const scheduleIdObj = typeof scheduleId === 'string' 
        ? ScheduleId.fromString(scheduleId)
        : scheduleId

      console.log(chalk.yellow(`❌ Rejecting transaction: ${scheduleIdObj.toString()}`))
      if (reason) {
        console.log(chalk.gray(`   Reason: ${reason}`))
      }

      // Update pending transaction status
      const pendingTx = this.pendingTransactions.get(scheduleIdObj.toString())
      if (pendingTx) {
        pendingTx.status = 'rejected'
        console.log(chalk.green(`✅ Transaction marked as rejected`))
      } else {
        console.log(chalk.yellow(`⚠️  Transaction not found in pending transactions`))
      }

      // Note: In Hedera, you cannot directly "reject" a scheduled transaction
      // Rejection is typically handled by not signing it, or by deleting the schedule
      // This method marks it as rejected in our internal state
    } catch (error) {
      console.error(chalk.red(`❌ Failed to reject transaction: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Get pending transactions from a connection topic
   * 
   * Note: This requires polling the connection topic for transaction messages
   * In a full implementation, this would parse messages from the topic
   */
  async getPendingTransactions(connectionTopicId: string): Promise<PendingTransaction[]> {
    try {
      // In a full implementation, we would:
      // 1. Poll messages from connectionTopicId
      // 2. Parse transaction_for_approval messages
      // 3. Return list of pending transactions
      
      // For now, return transactions from our internal tracking
      const pending: PendingTransaction[] = []
      
      for (const [scheduleIdStr, scheduledTx] of this.pendingTransactions.entries()) {
        if (scheduledTx.status === 'pending') {
          const pendingTx: PendingTransaction = {
            scheduleId: scheduledTx.scheduleId,
            description: `Transaction ${scheduleIdStr}`,
            transactionType: 'scheduled',
            createdAt: scheduledTx.createdAt,
            requiredSignatures: scheduledTx.requiredSignatures,
            currentSignatures: scheduledTx.currentSignatures
          }
          if (scheduledTx.expirationTime !== undefined) {
            pendingTx.expirationTime = scheduledTx.expirationTime
          }
          pending.push(pendingTx)
        }
      }

      return pending
    } catch (error) {
      console.error(chalk.red(`❌ Failed to get pending transactions: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Get a specific scheduled transaction by ID
   */
  getScheduledTransaction(scheduleId: string): ScheduledTransaction | null {
    return this.pendingTransactions.get(scheduleId) || null
  }
}

