/**
 * AP2 (A2A Payment) Protocol
 * Agent-to-Agent Payment Protocol for autonomous transactions
 */

export interface AP2PaymentRequest {
  id: string
  from: string
  to: string
  amount: string
  currency: string
  network: string
  description?: string
  metadata?: Record<string, any>
  createdAt: number
  expiresAt: number
}

export interface AP2PaymentResponse {
  requestId: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  transactionHash?: string
  message?: string
  timestamp: number
}

export interface AP2PaymentVerification {
  requestId: string
  transactionHash: string
  network: string
  verified: boolean
  confirmations: number
  timestamp: number
}

export class AP2Protocol {
  private network: string
  private currency: string

  constructor(network: string = 'solana-devnet', currency: string = 'USDC') {
    this.network = network
    this.currency = currency
  }

  createPaymentRequest(
    from: string,
    to: string,
    amount: number,
    description?: string,
    metadata?: Record<string, any>
  ): AP2PaymentRequest {
    const now = Date.now()

    const request: AP2PaymentRequest = {
      id: `ap2-${now}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      amount: amount.toString(),
      currency: this.currency,
      network: this.network,
      createdAt: now,
      expiresAt: now + (5 * 60 * 1000)
    }

    if (description !== undefined) request.description = description
    if (metadata !== undefined) request.metadata = metadata

    return request
  }

  createPaymentResponse(
    requestId: string,
    status: AP2PaymentResponse['status'],
    transactionHash?: string,
    message?: string
  ): AP2PaymentResponse {
    const response: AP2PaymentResponse = {
      requestId,
      status,
      timestamp: Date.now()
    }

    if (transactionHash !== undefined) response.transactionHash = transactionHash
    if (message !== undefined) response.message = message

    return response
  }

  verifyPayment(
    requestId: string,
    transactionHash: string,
    verified: boolean,
    confirmations: number = 0
  ): AP2PaymentVerification {
    return {
      requestId,
      transactionHash,
      network: this.network,
      verified,
      confirmations,
      timestamp: Date.now()
    }
  }

  isExpired(request: AP2PaymentRequest): boolean {
    return Date.now() > request.expiresAt
  }

  validateRequest(request: AP2PaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!request.id) errors.push('Missing request ID')
    if (!request.from) errors.push('Missing sender address')
    if (!request.to) errors.push('Missing recipient address')
    if (!request.amount || Number(request.amount) <= 0) {
      errors.push('Invalid amount')
    }
    if (!request.currency) errors.push('Missing currency')
    if (!request.network) errors.push('Missing network')
    if (this.isExpired(request)) errors.push('Request expired')

    return {
      valid: errors.length === 0,
      errors
    }
  }

  encodeRequest(request: AP2PaymentRequest): string {
    return Buffer.from(JSON.stringify(request)).toString('base64')
  }

  decodeRequest(encoded: string): AP2PaymentRequest {
    const json = Buffer.from(encoded, 'base64').toString('utf-8')
    return JSON.parse(json) as AP2PaymentRequest
  }
}

export class AP2PaymentNegotiation {
  private requests: Map<string, AP2PaymentRequest>
  private responses: Map<string, AP2PaymentResponse>

  constructor() {
    this.requests = new Map()
    this.responses = new Map()
  }

  proposePayment(request: AP2PaymentRequest): void {
    this.requests.set(request.id, request)
  }

  respondToPayment(response: AP2PaymentResponse): void {
    this.responses.set(response.requestId, response)
  }

  getRequest(requestId: string): AP2PaymentRequest | undefined {
    return this.requests.get(requestId)
  }

  getResponse(requestId: string): AP2PaymentResponse | undefined {
    return this.responses.get(requestId)
  }

  clearExpiredRequests(): number {
    let cleared = 0
    const now = Date.now()

    for (const [id, request] of this.requests.entries()) {
      if (request.expiresAt < now) {
        this.requests.delete(id)
        cleared++
      }
    }

    return cleared
  }
}
