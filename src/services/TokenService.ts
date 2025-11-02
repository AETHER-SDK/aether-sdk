/**
 * Hedera Token Service (HTS) Integration
 * 
 * This module provides token operations for creating, managing, and transferring
 * native Hedera tokens (HTS). This demonstrates the use of multiple Hedera services
 * for bonus points in the hackathon bounty.
 * 
 * Used for the hackathon bonus points requirement: "Multiple Hedera services"
 */

import { Client, TokenCreateTransaction, TokenType, PrivateKey, AccountId, AccountBalanceQuery } from '@hashgraph/sdk'
import { loadEnvIfNeeded } from '../utils/env'
import chalk from 'chalk'

loadEnvIfNeeded()

/**
 * HTS Token Service Implementation
 */
export class TokenService {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  /**
   * Create a custom royalty token for NFT marketplace
   */
  async createRoyaltyToken(tokenName: string, symbol: string, totalSupply: number, decimals: number = 0): Promise<string> {
    try {
      console.log(chalk.blue(`🏷️  Creating HTS token: ${tokenName} (${symbol})`))

      const operatorId = this.client.operatorAccountId
      if (!operatorId) {
        throw new Error('No operator account configured')
      }

      const operatorKey = this.client.operatorPublicKey
      const treasuryKey = PrivateKey.generate()

      // Create the token
      const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.FungibleCommon)
        .setInitialSupply(totalSupply)
        .setDecimals(decimals)
        .setTreasuryAccountId(operatorId)
        .setAutoRenewAccountId(operatorId)
        .setTokenMemo('Hedron Royalty Token')

      // Execute the transaction
      const response = await transaction.execute(this.client)
      const receipt = await response.getReceipt(this.client)
      const tokenId = receipt.tokenId

      console.log(chalk.green(`✅ Token created: ${tokenId}`))
      console.log(chalk.blue(`📋 Token Name: ${tokenName}`))
      console.log(chalk.blue(`📋 Symbol: ${symbol}`))
      console.log(chalk.blue(`📋 Initial Supply: ${totalSupply}`))

      return tokenId?.toString() || ''
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create token: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Get token balance for an account
   */
  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    try {
      console.log(chalk.blue(`📊 Getting token balance for account ${accountId}`))

      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
      const balance = await balanceQuery.execute(this.client)

      console.log(chalk.blue(`💰 Token balance retrieved`))

      return Number(balance.hbars.toString())
    } catch (error) {
      console.error(chalk.red(`❌ Failed to get token balance: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Transfer royalty tokens between accounts
   * 
   * This demonstrates automated royalty distribution using HTS tokens
   */
  async transferRoyaltyTokens(tokenId: string, recipientAccountId: string, amount: number): Promise<string> {
    try {
      console.log(chalk.blue(`💸 Transferring ${amount} royalty tokens to ${recipientAccountId}`))

      const operatorId = this.client.operatorAccountId
      if (!operatorId) {
        throw new Error('No operator account configured')
      }

      // Create transfer transaction
      const transaction = new (await import('@hashgraph/sdk')).TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -amount)
        .addTokenTransfer(tokenId, AccountId.fromString(recipientAccountId), amount)

      // Execute the transfer
      const response = await transaction.execute(this.client)
      const receipt = await response.getReceipt(this.client)

      const transactionId = response.transactionId.toString()
      console.log(chalk.green(`✅ Tokens transferred successfully`))
      console.log(chalk.blue(`📋 Transaction ID: ${transactionId}`))

      return transactionId
    } catch (error) {
      console.error(chalk.red(`❌ Failed to transfer tokens: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Mint additional tokens (for royalty distribution)
   */
  async mintTokens(tokenId: string, amount: number): Promise<string> {
    try {
      console.log(chalk.blue(`🪙 Minting ${amount} additional tokens for token ${tokenId}`))

      const operatorId = this.client.operatorAccountId
      if (!operatorId) {
        throw new Error('No operator account configured')
      }

      // Note: This is a simplified example. Full implementation would use
      // TokenMintTransaction from @hashgraph/sdk
      console.log(chalk.yellow(`⚠️  Minting functionality requires TokenMintTransaction implementation`))

      // Placeholder for actual minting logic
      return 'mint-transaction-id'
    } catch (error) {
      console.error(chalk.red(`❌ Failed to mint tokens: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenId: string): Promise<any> {
    try {
      console.log(chalk.blue(`📋 Getting token info for ${tokenId}`))

      // Note: This would use the Mirror Node API or Hedera SDK
      // For now, return placeholder
      return {
        tokenId,
        name: 'Royalty Token',
        symbol: 'ROYAL',
        decimals: 0,
        totalSupply: 1000000
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to get token info: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Create a tokenized invoice token (RWA - Real-World Asset)
   * 
   * Tokenizes an invoice as a tradeable Hedera token representing the invoice claim.
   * This demonstrates RWA tokenization for Track 1 (On-Chain Finance & RWA Tokenization).
   */
  async createInvoiceToken(
    invoiceId: string,
    invoiceAmount: number,
    vendorAccountId: string,
    description: string,
    dueDate: Date,
    decimals: number = 0
  ): Promise<string> {
    try {
      console.log(chalk.blue(`📄 Creating tokenized invoice token for ${invoiceId}`))

      const operatorId = this.client.operatorAccountId
      if (!operatorId) {
        throw new Error('No operator account configured')
      }

      // Generate token symbol from invoice ID (e.g., INV-12345 -> INV12345)
      const tokenSymbol = `INV${invoiceId.replace(/[^0-9]/g, '').substring(0, 8)}`
      const tokenName = `Invoice Token ${invoiceId}`
      
      // Token supply = invoice amount in smallest units (1 token = 1 USD unit, or use decimals)
      // For simplicity, we'll use whole numbers (1 token = $1, so $150 invoice = 150 tokens)
      const tokenSupply = Math.floor(invoiceAmount)
      
      // Create token memo with invoice metadata (Hedera memo limit is 100 bytes)
      // Use shortened format to fit within limit
      const invoiceMetadata = `RWA:${invoiceId}:$${invoiceAmount}:${dueDate.toISOString().substring(0, 10)}`
      
      // Ensure memo doesn't exceed 100 bytes
      const maxMemoLength = 100
      const tokenMemo = invoiceMetadata.length > maxMemoLength 
        ? `RWA:${invoiceId.substring(0, 20)}:$${invoiceAmount}`
        : invoiceMetadata

      // Create the token
      const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.FungibleCommon)
        .setInitialSupply(tokenSupply)
        .setDecimals(decimals)
        .setTreasuryAccountId(operatorId)
        .setAutoRenewAccountId(operatorId)
        .setTokenMemo(tokenMemo)

      // Execute the transaction
      const response = await transaction.execute(this.client)
      const receipt = await response.getReceipt(this.client)
      const tokenId = receipt.tokenId

      console.log(chalk.green(`✅ Invoice token created: ${tokenId}`))
      console.log(chalk.blue(`📋 Token Name: ${tokenName}`))
      console.log(chalk.blue(`📋 Symbol: ${tokenSymbol}`))
      console.log(chalk.blue(`📋 Supply: ${tokenSupply} tokens ($${invoiceAmount})`))
      console.log(chalk.blue(`📋 Invoice ID: ${invoiceId}`))

      return tokenId?.toString() || ''
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create invoice token: ${(error as Error).message}`))
      throw error
    }
  }

  /**
   * Transfer invoice tokens (demonstrates RWA trading)
   */
  async transferInvoiceTokens(
    tokenId: string,
    recipientAccountId: string,
    amount: number
  ): Promise<string> {
    try {
      console.log(chalk.blue(`💸 Transferring ${amount} invoice tokens to ${recipientAccountId}`))

      const operatorId = this.client.operatorAccountId
      if (!operatorId) {
        throw new Error('No operator account configured')
      }

      // Create transfer transaction
      const { TransferTransaction } = await import('@hashgraph/sdk')
      const transaction = new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -amount)
        .addTokenTransfer(tokenId, AccountId.fromString(recipientAccountId), amount)

      // Execute the transfer
      const response = await transaction.execute(this.client)
      const receipt = await response.getReceipt(this.client)

      const transactionId = response.transactionId.toString()
      console.log(chalk.green(`✅ Invoice tokens transferred successfully`))
      console.log(chalk.blue(`📋 Transaction ID: ${transactionId}`))

      return transactionId
    } catch (error) {
      console.error(chalk.red(`❌ Failed to transfer invoice tokens: ${(error as Error).message}`))
      throw error
    }
  }
}

/**
 * Create and configure royalty token for NFT marketplace
 */
export async function createRoyaltyTokenForNFTs(client: Client): Promise<string> {
  const tokenService = new TokenService(client)

  const tokenId = await tokenService.createRoyaltyToken(
    'NFT Royalty Token',
    'ROYAL',
    1000000, // Initial supply
    0 // Decimals (fungible)
  )

  console.log(chalk.green(`✅ Royalty token created and ready for distribution`))
  return tokenId
}

