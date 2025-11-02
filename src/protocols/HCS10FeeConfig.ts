/**
 * HCS-10 Fee Configuration Module
 * 
 * Provides fee configuration for HCS-10 connections.
 * Supports HBAR fees and custom fee structures.
 */

import { AccountId } from '@hashgraph/sdk'

/**
 * Fee configuration for HCS-10 connections
 */
export interface FeeConfig {
  hbarFee?: number
  recipientAccountId?: string
  treasuryFee?: number
}

/**
 * Fee configuration builder
 */
export class HCS10FeeConfig {
  private config: FeeConfig = {}

  /**
   * Add HBAR fee requirement
   */
  addHbarFee(amount: number, recipientAccountId?: string): HCS10FeeConfig {
    this.config.hbarFee = amount
    if (recipientAccountId) {
      this.config.recipientAccountId = recipientAccountId
    }
    return this
  }

  /**
   * Add treasury fee requirement
   */
  addTreasuryFee(amount: number): HCS10FeeConfig {
    this.config.treasuryFee = amount
    return this
  }

  /**
   * Build the fee configuration
   */
  build(): FeeConfig {
    return { ...this.config }
  }

  /**
   * Create fee config from options
   */
  static fromOptions(options: FeeConfig): HCS10FeeConfig {
    const builder = new HCS10FeeConfig()
    if (options.hbarFee !== undefined) {
      builder.addHbarFee(options.hbarFee, options.recipientAccountId)
    }
    if (options.treasuryFee !== undefined) {
      builder.addTreasuryFee(options.treasuryFee)
    }
    return builder
  }

  /**
   * Create no-fee configuration
   */
  static noFee(): FeeConfig {
    return {}
  }
}

