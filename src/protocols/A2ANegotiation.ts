/**
 * A2A Agent Negotiation Protocol
 * 
 * This module implements negotiation logic for agents to:
 * - Negotiate payment terms
 * - Handle counter-offers
 * - Manage negotiation timeouts
 * - Track negotiation history
 * 
 * Used for the hackathon bounty "Best Use of Hedera Agent Kit & Google A2A"
 */

import { A2AProtocol, A2AMessage } from './A2AProtocol'
import chalk from 'chalk'

/**
 * Negotiation State
 */
export enum NegotiationState {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  AGREED = "agreed",
  REJECTED = "rejected",
  TIMEOUT = "timeout"
}

/**
 * Negotiation Proposal
 */
export interface NegotiationProposal {
  proposalId: string
  negotiationType: "payment" | "service" | "delivery"
  from: string
  to: string
  currentOffer: any
  history: NegotiationEntry[]
  state: NegotiationState
  createdAt: number
  expiresAt: number
}

/**
 * Negotiation Entry in History
 */
export interface NegotiationEntry {
  timestamp: number
  agentId: string
  action: "propose" | "counter" | "accept" | "reject"
  proposal: any
  message?: string
}

/**
 * A2A Negotiation Protocol Implementation
 */
export class A2ANegotiation {
  private a2a: A2AProtocol
  private negotiations: Map<string, NegotiationProposal> = new Map()
  private readonly NEGOTIATION_TIMEOUT = 60000 // 60 seconds

  constructor(a2a: A2AProtocol) {
    this.a2a = a2a
  }

  /**
   * Start a new negotiation
   */
  startNegotiation(
    negotiationType: "payment" | "service" | "delivery",
    receiverAgentId: string,
    initialOffer: any
  ): string {
    const proposalId = `negotiation-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const proposal: NegotiationProposal = {
      proposalId,
      negotiationType,
      from: this.a2a['agentId'],
      to: receiverAgentId,
      currentOffer: initialOffer,
      history: [{
        timestamp: Date.now(),
        agentId: this.a2a['agentId'],
        action: "propose",
        proposal: initialOffer
      }],
      state: NegotiationState.PENDING,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.NEGOTIATION_TIMEOUT
    }

    this.negotiations.set(proposalId, proposal)

    // Set timeout
    setTimeout(() => {
      if (this.negotiations.has(proposalId)) {
        const neg = this.negotiations.get(proposalId)!
        if (neg.state === NegotiationState.PENDING || neg.state === NegotiationState.IN_PROGRESS) {
          neg.state = NegotiationState.TIMEOUT
          console.log(chalk.yellow(`⏰ Negotiation ${proposalId} timed out`))
          this.negotiations.set(proposalId, neg)
        }
      }
    }, this.NEGOTIATION_TIMEOUT)

    console.log(chalk.blue(`🚀 Starting ${negotiationType} negotiation ${proposalId}`))

    return proposalId
  }

  /**
   * Process incoming negotiation message
   */
  async processNegotiationMessage(message: A2AMessage): Promise<A2ANegotiationResult | null> {
    const payload = message.payload

    if (!payload || payload.type !== "negotiation") {
      return null
    }

    const action = payload.action as string
    const proposalId = payload.proposalId

    console.log(chalk.blue(`💬 Processing negotiation ${action} for ${proposalId}`))

    const negotiation = this.negotiations.get(proposalId)

    if (!negotiation) {
      console.log(chalk.yellow(`⚠️  Unknown negotiation ${proposalId}`))
      return null
    }

    switch (action) {
      case "counter":
        return await this.processCounterOffer(negotiation, payload.proposal)
      case "accept":
        return await this.processAcceptance(negotiation)
      case "reject":
        return await this.processRejection(negotiation)
      default:
        console.log(chalk.yellow(`⚠️  Unknown action: ${action}`))
        return null
    }
  }

  /**
   * Process counter-offer
   */
  private async processCounterOffer(negotiation: NegotiationProposal, proposal: any): Promise<A2ANegotiationResult> {
    negotiation.currentOffer = proposal
    negotiation.state = NegotiationState.IN_PROGRESS
    
    negotiation.history.push({
      timestamp: Date.now(),
      agentId: negotiation.to,
      action: "counter",
      proposal
    })

    this.negotiations.set(negotiation.proposalId, negotiation)

    console.log(chalk.yellow(`🔄 Counter-offer received: ${JSON.stringify(proposal)}`))

    return {
      proposalId: negotiation.proposalId,
      state: negotiation.state,
      currentOffer: proposal,
      action: "counter"
    }
  }

  /**
   * Process acceptance
   */
  private async processAcceptance(negotiation: NegotiationProposal): Promise<A2ANegotiationResult> {
    negotiation.state = NegotiationState.AGREED
    
    negotiation.history.push({
      timestamp: Date.now(),
      agentId: negotiation.to,
      action: "accept",
      proposal: negotiation.currentOffer
    })

    this.negotiations.set(negotiation.proposalId, negotiation)

    console.log(chalk.green(`✅ Negotiation agreed!`))

    return {
      proposalId: negotiation.proposalId,
      state: negotiation.state,
      currentOffer: negotiation.currentOffer,
      action: "accept"
    }
  }

  /**
   * Process rejection
   */
  private async processRejection(negotiation: NegotiationProposal): Promise<A2ANegotiationResult> {
    negotiation.state = NegotiationState.REJECTED
    
    negotiation.history.push({
      timestamp: Date.now(),
      agentId: negotiation.to,
      action: "reject",
      proposal: null
    })

    this.negotiations.set(negotiation.proposalId, negotiation)

    console.log(chalk.red(`❌ Negotiation rejected`))

    return {
      proposalId: negotiation.proposalId,
      state: negotiation.state,
      currentOffer: negotiation.currentOffer,
      action: "reject"
    }
  }

  /**
   * Counter-offer in an existing negotiation
   */
  async sendCounterOffer(proposalId: string, counterOffer: any): Promise<void> {
    const negotiation = this.negotiations.get(proposalId)

    if (!negotiation) {
      throw new Error(`Negotiation ${proposalId} not found`)
    }

    await this.a2a.sendMessage(
      negotiation.to,
      negotiation.to,
      "request",
      {
        type: "negotiation",
        action: "counter",
        proposalId,
        proposal: counterOffer
      }
    )
  }

  /**
   * Accept a negotiation
   */
  async acceptNegotiation(proposalId: string): Promise<void> {
    const negotiation = this.negotiations.get(proposalId)

    if (!negotiation) {
      throw new Error(`Negotiation ${proposalId} not found`)
    }

    await this.a2a.sendMessage(
      negotiation.to,
      negotiation.to,
      "response",
      {
        type: "negotiation",
        action: "accept",
        proposalId
      }
    )
  }

  /**
   * Get negotiation by ID
   */
  getNegotiation(proposalId: string): NegotiationProposal | null {
    return this.negotiations.get(proposalId) || null
  }

  /**
   * Get all active negotiations
   */
  getActiveNegotiations(): NegotiationProposal[] {
    return Array.from(this.negotiations.values())
      .filter(n => n.state === NegotiationState.PENDING || n.state === NegotiationState.IN_PROGRESS)
  }
}

/**
 * Negotiation Result
 */
export interface A2ANegotiationResult {
  proposalId: string
  state: NegotiationState
  currentOffer: any
  action: "counter" | "accept" | "reject"
}

/**
 * Payment Negotiation Example Flow:
 * 
 * SettlementAgent: "I propose 1 USDC payment"
 *   → creates negotiation with proposalId: "pay-123"
 *   → sends A2A request with initialOffer: { amount: 1, currency: "USDC" }
 * 
 * MerchantAgent: "I counter-propose 1.5 USDC"
 *   → receives negotiation "pay-123"
 *   → calls processCounterOffer with proposal: { amount: 1.5, currency: "USDC" }
 *   → sends A2A request back with counter offer
 * 
 * SettlementAgent: "I accept 1.2 USDC"
 *   → receives counter offer
 *   → sends A2A response with final offer: { amount: 1.2, currency: "USDC" }
 * 
 * MerchantAgent: "Agreed, proceed with 1.2 USDC"
 *   → calls acceptNegotiation("pay-123")
 *   → negotiation.state becomes AGREED
 *   → settlement proceeds
 */

