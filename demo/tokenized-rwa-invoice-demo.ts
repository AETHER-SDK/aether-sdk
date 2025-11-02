/**
 * Tokenized RWA Invoice Demo - Track 1: On-Chain Finance & RWA Tokenization
 * 
 * Demonstrates Real-World Asset (RWA) tokenization by converting invoices into tradeable Hedera tokens.
 * 
 * Complete lifecycle:
 * 1. Invoice creation
 * 2. Tokenization as HTS token
 * 3. Token trading/transfer (RWA market)
 * 4. Automated settlement via x402
 * 5. Token redemption (optional)
 * 
 * Technology:
 * - Hedera Token Service (HTS) for tokenization
 * - x402 payment standard for settlement
 * - Cross-chain payments (Hedera HBAR or Base Sepolia USDC)
 * - Autonomous agent settlement
 */

import { SettlementAgent } from '../src/agents/SettlementAgent'
import { TokenService } from '../src/services/TokenService'
import { Client, PrivateKey, AccountId, TransferTransaction, Hbar, HbarUnit } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

interface Invoice {
  invoiceId: string
  vendorAccountId: string
  amountUSD: number
  description: string
  dueDate: Date
}

interface TokenizedInvoice {
  invoiceId: string
  invoice: Invoice
  tokenId: string
  tokenSymbol: string
  tokenSupply: number
  ownerAccountId: string
  dueDate: Date
  settled: boolean
}

/**
 * Tokenized RWA Invoice Demo
 * Showcases complete invoice tokenization and settlement workflow
 */
async function tokenizedRWAInvoiceDemo(): Promise<void> {
  try {
    // Demo header
    console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  📄 TOKENIZED RWA INVOICE DEMO                                ║
║     Track 1: On-Chain Finance & RWA Tokenization             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`))

    console.log(chalk.bold('\n📖 Use Case: Invoice Tokenization as Real-World Asset\n'))
    console.log(chalk.blue('💼 Scenario:'))
    console.log(chalk.gray('   • Company receives invoice from vendor'))
    console.log(chalk.gray('   • Invoice is tokenized as tradeable asset on Hedera'))
    console.log(chalk.gray('   • Tokens can be traded/transferred (invoice factoring)'))
    console.log(chalk.gray('   • When due, automated settlement via x402'))
    console.log(chalk.gray('   • Token represents real-world business obligation'))
    console.log('')

    // Initialize Hedera client
    const hederaClient = Client.forTestnet()
    const accountId = process.env.HEDERA_ACCOUNT_ID
    const privateKey = process.env.HEDERA_PRIVATE_KEY

    if (!accountId || !privateKey) {
      throw new Error('Missing required Hedera credentials: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY')
    }

    hederaClient.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    )

    console.log(chalk.green('✅ Connected to Hedera Testnet'))
    console.log(chalk.blue(`📋 Account: ${accountId}\n`))

    // Get invoice amount from CLI or use default
    const invoiceAmount = parseFloat(process.argv[2] || '250')
    const merchantAccountId = process.env.HEDERA_MERCHANT_ACCOUNT_ID || accountId

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 1: Invoice Creation
    console.log(chalk.bold.yellow('📄 Phase 1: Invoice Creation\n'))

    const invoice: Invoice = {
      invoiceId: `INV-RWA-${Date.now()}`,
      vendorAccountId: merchantAccountId,
      amountUSD: invoiceAmount,
      description: 'Q1 Software Services - Development & Maintenance',
      dueDate: new Date(Date.now() + 86400000 * 30) // 30 days from now
    }

    console.log(chalk.blue('📋 Invoice Details:'))
    console.log(`   Invoice ID: ${invoice.invoiceId}`)
    console.log(`   Vendor: ${invoice.vendorAccountId}`)
    console.log(`   Amount: $${invoice.amountUSD.toFixed(2)}`)
    console.log(`   Description: ${invoice.description}`)
    console.log(`   Due Date: ${invoice.dueDate.toLocaleDateString()}`)
    console.log(`   Status: UNPAID (Real-World Asset)`)
    console.log('')

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 2: Tokenization
    console.log(chalk.bold.yellow('🏷️  Phase 2: Tokenization as RWA\n'))

    console.log(chalk.blue('🔄 Converting invoice to tradeable token...'))
    console.log(chalk.gray('   • Creating Hedera Token Service (HTS) token'))
    console.log(chalk.gray('   • Token represents invoice claim'))
    console.log(chalk.gray('   • Supply = invoice amount (1 token = $1)'))
    console.log(chalk.gray('   • Metadata stored in token memo'))
    console.log('')

    const tokenService = new TokenService(hederaClient)
    
    const tokenId = await tokenService.createInvoiceToken(
      invoice.invoiceId,
      invoice.amountUSD,
      invoice.vendorAccountId,
      invoice.description,
      invoice.dueDate
    )

    // Generate token symbol from invoice ID
    const tokenSymbol = `INV${invoice.invoiceId.replace(/[^0-9]/g, '').substring(0, 8)}`
    const tokenizedInvoice: TokenizedInvoice = {
      invoiceId: invoice.invoiceId,
      invoice,
      tokenId,
      tokenSymbol,
      tokenSupply: Math.floor(invoice.amountUSD),
      ownerAccountId: accountId,
      dueDate: invoice.dueDate,
      settled: false
    }

    console.log(chalk.green('\n✅ Invoice Successfully Tokenized!\n'))
    console.log(chalk.blue('📊 Tokenized Invoice Details:'))
    console.log(`   Token ID: ${tokenId}`)
    console.log(`   Token Symbol: ${tokenSymbol}`)
    console.log(`   Token Supply: ${tokenizedInvoice.tokenSupply} tokens`)
    console.log(`   Invoice Amount: $${invoice.amountUSD}`)
    console.log(`   Owner: ${accountId}`)
    console.log(chalk.blue('\n💡 This token is now a tradeable Real-World Asset on Hedera'))
    console.log('')

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 3: Token Trading/Transfer (RWA Market)
    console.log(chalk.bold.yellow('💱 Phase 3: Token Trading (RWA Market)\n'))

    console.log(chalk.blue('🔄 Demonstrating RWA token transfer...'))
    console.log(chalk.gray('   • Scenario: Invoice factoring'))
    console.log(chalk.gray('   • Company sells invoice tokens to financier'))
    console.log(chalk.gray('   • Tokens transfer ownership on-chain'))
    console.log('')

    // For demo, transfer a portion of tokens to merchant account (simulating invoice factoring)
    const transferAmount = Math.floor(tokenizedInvoice.tokenSupply * 0.5) // 50% of invoice
    
    console.log(chalk.blue(`📋 Transferring ${transferAmount} tokens (50% of invoice)`))
    console.log(chalk.blue(`   From: ${accountId} (Original Holder)`))
    console.log(chalk.blue(`   To: ${merchantAccountId} (Factoring Company)`))
    console.log('')

    try {
      const transferTxId = await tokenService.transferInvoiceTokens(
        tokenId,
        merchantAccountId,
        transferAmount
      )

      console.log(chalk.green(`✅ Token transfer completed!`))
      console.log(chalk.blue(`📋 Transaction ID: ${transferTxId}`))
      console.log(chalk.blue(`🔗 HashScan: https://hashscan.io/testnet/transaction/${encodeURIComponent(transferTxId)}`))
      console.log('')

      console.log(chalk.cyan('💡 RWA Trading Benefits:'))
      console.log('   ✅ Invoice liquidity (immediate cash flow)')
      console.log('   ✅ Fractional ownership (sell 50%, keep 50%)')
      console.log('   ✅ Transparent on-chain transfer')
      console.log('   ✅ Immutable ownership records')
      console.log('')

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Token transfer skipped (may require token association): ${(error as Error).message}`))
      console.log(chalk.gray('   Note: In production, accounts must associate tokens before receiving them'))
      console.log('')
    }

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 4: Automated Settlement (when due)
    console.log(chalk.bold.yellow('💰 Phase 4: Automated Settlement via x402\n'))

    console.log(chalk.blue('🔄 Invoice due date reached - triggering automated settlement...'))
    console.log(chalk.gray('   • Autonomous agent detects invoice is due'))
    console.log(chalk.gray('   • Executes x402 payment to vendor'))
    console.log(chalk.gray('   • Cross-chain settlement (Base Sepolia USDC or Hedera HBAR)'))
    console.log('')

    // Initialize SettlementAgent for x402 payment
    const settlement = new SettlementAgent()
    console.log(chalk.yellow('⏳ Initializing SettlementAgent...'))
    await settlement.init()
    console.log(chalk.green('✅ SettlementAgent ready\n'))
    
    // HCS-10: Optional transaction approval for high-value RWA settlements
    const useHCS10Connections = process.env.USE_HCS10_CONNECTIONS === 'true'
    const useTransactionApproval = useHCS10Connections && invoice.amountUSD >= 500 // High-value threshold

    // Determine payment network
    const paymentNetwork = process.env.PAYMENT_NETWORK || 'base-sepolia'
    const settlementAsset = paymentNetwork === 'hedera-testnet' ? 'HBAR' : 'USDC'

    console.log(chalk.blue('📋 Settlement Configuration:'))
    console.log(`   Network: ${paymentNetwork}`)
    console.log(`   Asset: ${settlementAsset}`)
    console.log(`   Amount: $${invoice.amountUSD}`)
    console.log(`   Vendor: ${invoice.vendorAccountId}`)
    console.log(`   Invoice: ${invoice.invoiceId}`)
    console.log('')

    console.log(chalk.yellow('⏳ Executing x402 payment flow...'))
    console.log(chalk.gray('   1. Creating payment authorization'))
    console.log(chalk.gray('   2. Verifying payment via facilitator'))
    console.log(chalk.gray(`   3. Settling ${settlementAsset} on ${paymentNetwork}`))
    console.log('')

    // Calculate payment amount based on network
    let paymentAmount: string
    if (paymentNetwork === 'hedera-testnet') {
      // Convert USD to HBAR (approximate rate: $0.05 per HBAR)
      const hbarAmount = Math.ceil(invoice.amountUSD / 0.05)
      const tinybarAmount = hbarAmount * 100_000_000
      paymentAmount = tinybarAmount.toString()
      console.log(chalk.blue(`📋 Converted $${invoice.amountUSD} to ${hbarAmount} HBAR (${tinybarAmount} tinybars)`))
    } else {
      // USDC atomic units (6 decimals)
      paymentAmount = (invoice.amountUSD * 1000000).toString()
    }

    const verificationResult = {
      type: 'verification_result',
      agentId: 'rwa-invoice-agent',
      proposalId: `invoice-settlement-${invoice.invoiceId}`,
      approved: true,
      reasoning: `Invoice ${invoice.invoiceId} due - automated settlement via x402. Tokenized invoice: ${tokenId}`,
      paymentDetails: {
        amount: paymentAmount,
        asset: paymentNetwork === 'base-sepolia' 
          ? (process.env.USDC_CONTRACT || '0x036CbD53842c5426634e7929541eC2318f3dCF7e')
          : 'HBAR',
        payTo: paymentNetwork === 'base-sepolia'
          ? (process.env.MERCHANT_WALLET_ADDRESS || '0xb36faaA498D6E40Ee030fF651330aefD1b8D24D2')
          : invoice.vendorAccountId,
        description: `RWA Invoice Settlement: ${invoice.invoiceId}`
      }
    }

    // HCS-10: Use transaction approval for high-value settlements
    let settlementMethod = 'Direct x402 Execution'
    let txId: string | null = null
    
    if (useTransactionApproval && paymentNetwork === 'hedera-testnet') {
      try {
        const txApproval = settlement.getTransactionApproval()
        const settlementConn = settlement.getConnectionManager()
        
        if (txApproval && settlementConn) {
          console.log(chalk.yellow('📋 Using HCS-10 transaction approval for high-value RWA settlement...\n'))
          
          // Try to establish connection to vendor
          const connection = await settlementConn.requestConnection(invoice.vendorAccountId, { timeout: 30000 })
          
          if (connection && connection.status === 'established' && connection.connectionTopicId) {
            console.log(chalk.blue('✅ Connection established for transaction approval'))
            
            // Calculate HBAR amount
            const hbarAmount = Math.ceil(invoice.amountUSD / 0.05)
            
            const paymentTx = new TransferTransaction()
              .addHbarTransfer(
                AccountId.fromString(accountId),
                Hbar.from(-hbarAmount, HbarUnit.Hbar)
              )
              .addHbarTransfer(
                AccountId.fromString(invoice.vendorAccountId),
                Hbar.from(hbarAmount, HbarUnit.Hbar)
              )
              .setTransactionMemo(`RWA Invoice Settlement: ${invoice.invoiceId} | Token: ${tokenId}`)
            
            const scheduledTx = await txApproval.sendTransaction(
              connection.connectionTopicId,
              paymentTx,
              `RWA Invoice Settlement: $${invoice.amountUSD} for tokenized invoice`,
              {
                scheduleMemo: `Invoice: ${invoice.invoiceId} | Token: ${tokenId} | ${invoice.description}`,
                expirationTime: 3600
              }
            )
            
            console.log(chalk.blue(`📋 Transaction scheduled: ${scheduledTx.scheduleId.toString()}`))
            console.log(chalk.yellow('⏳ Vendor approval required for RWA settlement...'))
            console.log(chalk.gray(`   Token ID: ${tokenId}`))
            console.log(chalk.gray(`   Amount: $${invoice.amountUSD}`))
            
            // Auto-approve for demo (in production, vendor would approve)
            await txApproval.approveTransaction(scheduledTx.scheduleId)
            console.log(chalk.green('✅ Transaction approved and executed via HCS-10!'))
            txId = scheduledTx.scheduleId.toString()
            settlementMethod = 'HCS-10 Transaction Approval'
          } else {
            throw new Error('Connection not established')
          }
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Transaction approval failed: ${(error as Error).message}`))
        console.log(chalk.gray('   Falling back to direct x402 execution...\n'))
      }
    }
    
    // Fallback: Direct x402 execution
    if (!useTransactionApproval || !txId || paymentNetwork !== 'hedera-testnet') {
      try {
        await settlement.triggerSettlement(verificationResult)
        
        console.log(chalk.bold.green('\n✅ INVOICE SETTLEMENT EXECUTED!\n'))
      console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

      // Phase 5: Settlement Summary
      console.log(chalk.bold.yellow('📊 Phase 5: Settlement Summary\n'))

      tokenizedInvoice.settled = true

      console.log(chalk.green('✅ Invoice Status: SETTLED'))
      console.log(`   Invoice ID: ${invoice.invoiceId}`)
      console.log(`   Token ID: ${tokenId}`)
      console.log(`   Amount Paid: $${invoice.amountUSD}`)
      console.log(`   Network: ${paymentNetwork}`)
      console.log(`   Asset: ${settlementAsset}`)
      console.log(`   Vendor: ${invoice.vendorAccountId}`)
      console.log(`   Settlement Method: ${settlementMethod}`)
      if (txId) {
        console.log(`   Transaction ID: ${txId}`)
      }
      console.log('')

      console.log(chalk.blue('🔗 Transaction Details:'))
      console.log(chalk.gray('   Check terminal output above for transaction hash'))
      if (paymentNetwork === 'base-sepolia') {
        console.log(chalk.gray('   Explorer: https://sepolia.basescan.org'))
      } else {
        console.log(chalk.gray('   Explorer: https://hashscan.io/testnet'))
      }
      console.log('')

      // Track 1 Alignment
      console.log(chalk.bold.cyan('🎯 Track 1: On-Chain Finance & RWA Tokenization'))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   ✅ Real-World Asset tokenization (invoices as RWAs)')
      console.log('   ✅ On-chain finance (tokenized invoice trading)')
      console.log('   ✅ Cross-chain settlement infrastructure')
      console.log('   ✅ Automated payment execution')
      console.log('   ✅ Blockchain-based asset management')
      console.log('')

      // Business Impact
      console.log(chalk.bold.magenta('💼 Business Impact:'))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   • Invoice factoring market (improved liquidity)')
      console.log('   • Fractional ownership of invoices')
      console.log('   • Automated payment processing')
      console.log('   • Transparent audit trail on blockchain')
      console.log('   • Reduced payment processing time (days → seconds)')
      console.log('   • Cross-chain settlement flexibility')
      console.log('')

      console.log(chalk.bold.green('🎉 TOKENIZED RWA INVOICE DEMO COMPLETE!\n'))

    } catch (error) {
      console.log(chalk.red(`\n❌ Settlement failed: ${error instanceof Error ? error.message : String(error)}`))
      console.log(chalk.yellow('\n💡 Possible causes:'))
      if (paymentNetwork === 'base-sepolia') {
        console.log(chalk.gray('   • Insufficient USDC balance on Base Sepolia'))
      } else {
        console.log(chalk.gray('   • Insufficient HBAR balance'))
      }
      console.log(chalk.gray('   • Network connectivity issues'))
      console.log(chalk.gray('   • Check wallet status: npm run check:wallets'))
      throw error
    }
    }

  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error)
    throw error
  } finally {
    // Close Hedera client if initialized
    process.exit(0)
  }
}

// Run the demo
tokenizedRWAInvoiceDemo()
  .then(() => {
    console.log(chalk.green('\n✅ Demo completed successfully!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Demo failed:'), error)
    process.exit(1)
  })

