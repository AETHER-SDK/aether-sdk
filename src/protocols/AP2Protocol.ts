/**
 * AP2 Payment Protocol Implementation
 * 
 * AP2 (A2A Payment Protocol) is used for agent-to-agent payments
 * on the Hedera network. This protocol extends the A2A standard
 * with payment-specific functionality.
 * 
 * @see https://github.com/a2aproject/A2A
 */

import { A2AMessage } from './A2AProtocol'
import chalk from 'chalk'

/**
 * AP2 Payment Request
 */
export interface AP2PaymentRequest {
  protocol: "AP2"
  version: "1.0"
  paymentId: string
  amount: string
  currency: "HBAR" | "USDC"
  recipient: string
  network: "hedera-testnet" | "base-sepolia" | "ethereum-sepolia"
  metadata: {
    purpose: string
    reference: string
    description?: string
  }
  expiry: number
  signature?: string
}

/**
 * AP2 Payment Response
 */
export interface AP2PaymentResponse {
  paymentId: string
  status: "pending" | "processing" | "completed" | "failed" | "rejected"
  transactionHash?: string
  error?: string
  timestamp: number
}

/**
 * AP2 Protocol Implementation
 */
export class AP2Protocol {
  /**
   * Create an AP2 payment request
   */
  static createPaymentRequest(
    paymentId: string,
    amount: string,
    currency: "HBAR" | "USDC",
    recipient: string,
    network: "hedera-testnet" | "base-sepolia" | "ethereum-sepolia",
    metadata: { purpose: string; reference: string; description?: string }
  ): AP2PaymentRequest {
    const request: AP2PaymentRequest = {
      protocol: "AP2",
      version: "1.0",
      paymentId,
      amount,
      currency,
      recipient,
      network,
      metadata,
      expiry: Date.now() + 300000 // 5 minutes
    }

    console.log(chalk.blue(`💳 Creating AP2 payment request: ${JSON.stringify(request)}`))

    return request
  }

  /**
   * Validate an AP2 payment request
   */
  static validatePaymentRequest(request: AP2PaymentRequest): { valid: boolean; error?: string } {
    // Check protocol
    if (request.protocol !== "AP2") {
      return { valid: false, error: "Invalid protocol (expected AP2)" }
    }

    // Check version
    if (request.version !== "1.0") {
      return { valid: false, error: "Invalid version (expected 1.0)" }
    }

    // Check amount
    const amount = parseFloat(request.amount)
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, error: "Invalid amount" }
    }

    // Check expiry
    if (request.expiry < Date.now()) {
      return { valid: false, error: "Payment request expired" }
    }

    // Check metadata
    if (!request.metadata.purpose || !request.metadata.reference) {
      return { valid: false, error: "Missing required metadata (purpose or reference)" }
    }

    console.log(chalk.green(`✅ AP2 payment request validation passed`))

    return { valid: true }
  }

  /**
   * Create AP2 payment message for A2A protocol
   */
  static createAP2Message(paymentRequest: AP2PaymentRequest): any {
    return {
      type: "ap2_payment",
      data: paymentRequest
    }
  }

  /**
   * Parse AP2 payment from A2A message
   */
  static parseAP2Message(message: A2AMessage): AP2PaymentRequest | null {
    if (!message.payload || message.payload.type !== "ap2_payment") {
      return null
    }

    return message.payload.data as AP2PaymentRequest
  }

  /**
   * Create payment response
   */
  static createPaymentResponse(
    paymentId: string,
    status: "pending" | "processing" | "completed" | "failed" | "rejected",
    transactionHash?: string,
    error?: string
  ): AP2PaymentResponse {
    const response: AP2PaymentResponse = {
      paymentId,
      status,
      ...(transactionHash !== undefined && { transactionHash }),
      ...(error !== undefined && { error }),
      timestamp: Date.now()
    }

    console.log(chalk.blue(`📋 AP2 payment response: ${JSON.stringify(response)}`))

    return response
  }

  /**
   * Format payment amount for display
   */
  static formatAmount(amount: string, currency: string): string {
    const numAmount = parseFloat(amount)
    
    if (currency === "HBAR") {
      return `${numAmount} ${currency}`
    } else if (currency === "USDC") {
      return `${numAmount} ${currency}`
    }
    
    return `${amount} ${currency}`
  }

  /**
   * Check if payment request matches response
   */
  static matches(request: AP2PaymentRequest, response: AP2PaymentResponse): boolean {
    return request.paymentId === response.paymentId
  }
}

/**
 * AP2 Payment Flow:
 * 
 * 1. Agent A creates AP2 payment request
 *    → createsPaymentRequest({ amount: "1000000", currency: "USDC", ... })
 * 
 * 2. Agent A sends AP2 message via A2A protocol
 *    → wraps payment request in A2A message
 *    → sends to Agent B
 * 
 * 3. Agent B receives AP2 payment request
 *    → validates request
 *    → processes payment (or rejects)
 *    → sends AP2 payment response
 * 
 * 4. Agent A receives AP2 payment response
 *    → checks status (completed/failed/rejected)
 *    → records transaction hash if completed
 */

