/**
 * Direct HBAR Transfer with x402
 * 
 * Demonstrates x402 payment standard using Hedera native HBAR:
 * - Direct Hedera HBAR transfers
 * - No cross-chain complexity
 * - Fast native settlements
 * - x402 verification on Hedera
 */

import { SettlementAgent } from '../src/agents/SettlementAgent'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

interface HBARPayment {
  amount: number // HBAR
  recipient: string
  purpose: string
  network: string
}

async function hbarDirectX402Demo(): Promise<void> {
  try {
    console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  💎 DIRECT HBAR TRANSFER WITH x402                            ║
║     x402 payment standard on native Hedera network            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`))

    // Initialize SettlementAgent for Hedera native payments
    console.log(chalk.bold('--- Initializing Settlement Agent ---'))
    const settlement = new SettlementAgent()
    await settlement.init()
    console.log(chalk.green('✅ SettlementAgent ready for Hedera payments'))
    console.log('')

    // Create HBAR payment details
    console.log(chalk.bold('--- Creating HBAR Payment ---'))
    
    const hbarAmount = parseFloat(process.argv[2] || '10')
    
    const payment: HBARPayment = {
      amount: hbarAmount,
      recipient: process.env.HEDERA_MERCHANT_ACCOUNT_ID || '0.0.7135719',
      purpose: 'Direct HBAR payment via x402',
      network: 'hedera-testnet'
    }

    console.log(chalk.blue('💎 Payment Details:'))
    console.log(`   Amount: ${payment.amount} HBAR`)
    console.log(`   Recipient: ${payment.recipient}`)
    console.log(`   Network: Hedera Testnet`)
    console.log(`   Purpose: ${payment.purpose}`)
    console.log('')

    // Step 1: Execute x402 payment with HBAR
    console.log(chalk.bold('--- Step 1: Executing x402 HBAR Payment ---'))
    console.log(chalk.yellow('🔧 Executing Hedera native payment...'))
    console.log(chalk.gray('   1. Verifying payment via facilitator'))
    console.log(chalk.gray('   2. Executing HBAR transfer on Hedera'))
    console.log(chalk.gray('   3. Recording settlement receipt'))
    console.log('')

    const verificationResult = {
      type: 'verification_result',
      agentId: 'payment-agent',
      proposalId: `hbar-payment-${Date.now()}`,
      approved: true,
      reasoning: `Direct HBAR payment of ${payment.amount} HBAR approved`,
      paymentDetails: {
        amount: payment.amount.toString(),
        asset: 'HBAR',
        payTo: payment.recipient,
        network: payment.network
      }
    }

    try {
      await settlement.triggerSettlement(verificationResult)
      
      console.log(chalk.bold.green('✅ HBAR Payment Executed via x402!'))
      console.log('')
      console.log(chalk.green('💎 Settlement Summary:'))
      console.log(`   Amount: ${payment.amount} HBAR`)
      console.log(`   Recipient: ${payment.recipient}`)
      console.log(`   Network: Hedera Testnet`)
      console.log(`   Method: x402 with native HBAR`)
      console.log('')

      console.log(chalk.bold.cyan('\n💡 Benefits of x402 with HBAR:'))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   ✅ Native Hedera currency')
      console.log('   ✅ Fast transactions (2-3 seconds)')
      console.log('   ✅ Low fees')
      console.log('   ✅ x402 standard compliance')
      console.log('   ✅ Payment verification built-in')
      console.log('')

    } catch (error) {
      console.log(chalk.red(`❌ Payment failed: ${error instanceof Error ? error.message : String(error)}`))
      throw error
    }

    console.log(chalk.green('🎉 HBAR Direct Payment Demo Complete!'))

  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error)
    throw error
  }
}

// Run the demo
hbarDirectX402Demo()
  .then(() => {
    console.log(chalk.green('\n✅ Demo completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Demo failed:'), error)
    process.exit(1)
  })

