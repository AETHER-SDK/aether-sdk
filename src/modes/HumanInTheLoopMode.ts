/**
 * Human-in-the-Loop Mode
 * 
 * This module implements human approval workflows for autonomous agents.
 * When enabled, agents will pause and request human approval for:
 * - High-value payments
 * - Sensitive operations
 * - Custom-defined approval thresholds
 * 
 * Used for the hackathon bonus points requirement
 */

import chalk from 'chalk'
import * as readline from 'readline'

/**
 * Approval Request
 */
export interface ApprovalRequest {
  requestId: string
  action: string
  description: string
  details: any
  createdAt: number
  status?: "pending" | "approved" | "rejected" | "expired"
}

/**
 * Approval Result
 */
export interface ApprovalResult {
  approved: boolean
  requestId: string
  timestamp: number
  reason?: string
}

/**
 * Human-in-the-Loop Configuration
 */
export interface HITLConfig {
  enabled: boolean
  requireApprovalFor?: string[]
  approvalThresholds?: {
    payment?: number // USD equivalent
    transaction?: number // Transaction count
    custom?: Map<string, number>
  }
  timeout?: number // Milliseconds
  autoApproveTimeout?: boolean // Auto-approve if timeout
}

/**
 * Human-in-the-Loop Mode Implementation
 */
export class HumanInTheLoopMode {
  private config: HITLConfig
  private pendingRequests: Map<string, ApprovalRequest> = new Map()
  private rl?: readline.Interface
  private callbacks: Map<string, (result: ApprovalResult) => void> = new Map()

  constructor(config?: HITLConfig) {
    this.config = {
      enabled: false,
      requireApprovalFor: [],
      approvalThresholds: {
        payment: 100, // Default $100
        transaction: 10
      },
      timeout: 300000, // 5 minutes default
      autoApproveTimeout: false,
      ...config
    }
  }

  /**
   * Check if action requires human approval
   */
  requiresApproval(action: string, details: any): boolean {
    if (!this.config.enabled) {
      return false
    }

    // Check if action is in requireApprovalFor list
    if (this.config.requireApprovalFor && this.config.requireApprovalFor.includes(action)) {
      return true
    }

    // Check payment threshold
    if (action === "payment" && this.config.approvalThresholds?.payment) {
      const amount = details.amount || 0
      if (amount >= this.config.approvalThresholds.payment) {
        console.log(chalk.yellow(`⚠️  Payment amount ${amount} exceeds threshold ${this.config.approvalThresholds.payment}`))
        return true
      }
    }

    // Check transaction threshold
    if (action === "transaction" && this.config.approvalThresholds?.transaction) {
      const count = details.count || 0
      if (count >= this.config.approvalThresholds.transaction) {
        console.log(chalk.yellow(`⚠️  Transaction count ${count} exceeds threshold ${this.config.approvalThresholds.transaction}`))
        return true
      }
    }

    return false
  }

  /**
   * Request human approval
   */
  async requestApproval(request: Omit<ApprovalRequest, 'requestId' | 'createdAt' | 'status'>): Promise<ApprovalResult> {
    const requestId = `approval-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const fullRequest: ApprovalRequest = {
      ...request,
      requestId,
      createdAt: Date.now(),
      status: "pending"
    }

    this.pendingRequests.set(requestId, fullRequest)

    console.log(chalk.yellow(`\n🤔 HUMAN APPROVAL REQUIRED`))
    console.log(chalk.bold(`─────────────────────────────────────────────────────`))
    console.log(chalk.blue(`Request ID: ${requestId}`))
    console.log(chalk.blue(`Action: ${request.action}`))
    console.log(chalk.blue(`Description: ${request.description}`))
    console.log(chalk.gray(`Details: ${JSON.stringify(request.details, null, 2)}`))
    console.log(chalk.bold(`─────────────────────────────────────────────────────\n`))

    return new Promise((resolve) => {
      this.callbacks.set(requestId, resolve)

      // Set timeout if configured
      if (this.config.timeout) {
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            const result = this.config.autoApproveTimeout ? 
              this.createApprovalResult(requestId, true, "Auto-approved due to timeout") :
              this.createApprovalResult(requestId, false, "Request timed out")
            
            resolve(result)
            this.callbacks.delete(requestId)
            this.pendingRequests.delete(requestId)
          }
        }, this.config.timeout)
      }

      // Request approval via CLI
      this.requestCLIApproval(requestId, request)
    })
  }

  /**
   * Request approval via CLI
   */
  private async requestCLIApproval(requestId: string, request: any): Promise<void> {
    console.log(chalk.bold(`Options:`))
    console.log(chalk.green(`[y] Yes - Approve and proceed`))
    console.log(chalk.red(`[n] No - Reject and cancel`))
    console.log(chalk.bold(`[Enter your choice (y/n):]`))

    // Create readline interface if not exists
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
    }

    const answer = await new Promise<string>((resolve) => {
      this.rl!.question('', (answer) => {
        resolve(answer.trim().toLowerCase())
      })
    })

    const approved = answer === 'y' || answer === 'yes'
    const callback = this.callbacks.get(requestId)

    if (callback) {
      const result = this.createApprovalResult(
        requestId,
        approved,
        approved ? 'Human approved' : 'Human rejected'
      )
      callback(result)
      this.callbacks.delete(requestId)
    }

    this.pendingRequests.delete(requestId)

    if (approved) {
      console.log(chalk.green(`✅ Approval granted, proceeding...\n`))
    } else {
      console.log(chalk.red(`❌ Approval denied, canceling...\n`))
    }
  }

  /**
   * Create approval result
   */
  private createApprovalResult(requestId: string, approved: boolean, reason: string): ApprovalResult {
    const result = {
      approved,
      requestId,
      timestamp: Date.now(),
      reason
    }

    // Update request status
    const request = this.pendingRequests.get(requestId)
    if (request) {
      request.status = approved ? "approved" : "rejected"
      this.pendingRequests.set(requestId, request)
    }

    return result
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values()).filter(r => r.status === "pending")
  }

  /**
   * Enable HITL mode
   */
  enable(): void {
    this.config.enabled = true
    console.log(chalk.green(`✅ Human-in-the-Loop mode enabled`))
  }

  /**
   * Disable HITL mode
   */
  disable(): void {
    this.config.enabled = false
    console.log(chalk.yellow(`⚠️  Human-in-the-Loop mode disabled`))
  }

  /**
   * Set approval threshold for payments
   */
  setPaymentThreshold(threshold: number): void {
    if (!this.config.approvalThresholds) {
      this.config.approvalThresholds = {}
    }
    this.config.approvalThresholds.payment = threshold
    console.log(chalk.blue(`💰 Payment approval threshold set to $${threshold}`))
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.rl) {
      this.rl.close()
    }
  }
}

