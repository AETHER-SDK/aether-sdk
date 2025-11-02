import { SettlementAgent } from '../../src/agents/SettlementAgent'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testSettlementWithPayment(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Testing SettlementAgent with Real Payment'))
    console.log(chalk.gray('This will run SettlementAgent and trigger a real x402 payment'))
    console.log('')

    // Initialize SettlementAgent
    console.log(chalk.bold('--- Initializing SettlementAgent ---'))
    const settlement = new SettlementAgent()
    await settlement.init()

    console.log(chalk.green('✓ SettlementAgent ready and listening'))
    console.log('')

    console.log(chalk.bold('--- Payment Configuration ---'))
    console.log(chalk.blue('💰 Settlement Wallet:'))
    console.log(`   ${process.env.SETTLEMENT_WALLET_PRIVATE_KEY?.substring(0, 10)}...`)
    console.log(chalk.blue('🏪 Merchant Wallet:'))
    console.log(`   ${process.env.MERCHANT_WALLET_ADDRESS}`)
    console.log(chalk.blue('💵 USDC Contract:'))
    console.log(`   ${process.env.USDC_CONTRACT}`)
    console.log(chalk.blue('🌐 Base Sepolia RPC:'))
    console.log(`   ${process.env.BASE_RPC_URL}`)
    console.log('')

    console.log(chalk.bold('--- Manual Payment Test ---'))
    console.log(chalk.yellow('🔧 Testing x402 payment execution directly...'))
    
    // Test the payment execution directly
    const verification = {
      type: 'verification_result',
      originalProposal: {
        accountId: '0.0.123456',
        balance: '3446.12525862 ℏ',
        threshold: 50,
        meetsThreshold: true
      },
      approved: true,
      reasoning: 'Manual test - account meets threshold',
      timestamp: Date.now()
    }

    // Access the private method for testing
    const settlementAgent = settlement as any
    await settlementAgent.executeSettlement(verification)

    console.log(chalk.bold('--- Monitoring Links ---'))
    console.log(chalk.green('✅ Check the following for transaction details:'))
    console.log(chalk.blue('📡 HashScan Settlement Topic:'))
    console.log(`   https://hashscan.io/testnet/topic/${process.env.SETTLEMENT_TOPIC_ID}`)
    console.log(chalk.blue('🌐 BaseScan (for x402 payment):'))
    console.log('   https://sepolia.basescan.org')
    console.log(chalk.blue('🔍 Search by wallet address:'))
    console.log(`   https://sepolia.basescan.org/address/${process.env.MERCHANT_WALLET_ADDRESS}`)

  } catch (error) {
    console.error(chalk.red('❌ Settlement payment test failed:'), error)
    throw error
  }
}

// Run the test
testSettlementWithPayment()
  .then(() => {
    console.log(chalk.green('\n🎉 Settlement payment test completed!'))
    console.log(chalk.yellow('💡 Check BaseScan for the actual x402 payment transaction'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Settlement payment test failed:'), error)
    process.exit(1)
  })
