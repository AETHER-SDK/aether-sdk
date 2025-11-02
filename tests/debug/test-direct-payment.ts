import { SettlementAgent } from '../../src/agents/SettlementAgent'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testDirectPayment(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Testing Direct x402 Payment'))
    console.log(chalk.gray('This will trigger SettlementAgent directly with a verification result'))
    console.log('')

    // Initialize SettlementAgent
    console.log(chalk.bold('--- Initializing SettlementAgent ---'))
    const settlement = new SettlementAgent()
    await settlement.init()

    console.log(chalk.green('✓ SettlementAgent ready'))
    console.log('')

    // Create a verification result that will trigger payment
    const verificationResult = {
      type: 'verification_result',
      originalProposal: {
        type: 'analysis_proposal',
        accountId: '0.0.123456',
        balance: '3446.12525862 ℏ',
        threshold: 50,
        meetsThreshold: true,
        timestamp: Date.now()
      },
      approved: true,
      reasoning: 'Account meets threshold requirements for payment',
      timestamp: Date.now()
    }

    console.log(chalk.bold('--- Sending Verification Result ---'))
    console.log(chalk.yellow('📤 Sending verification result to SettlementAgent...'))
    
    // Send verification result to SettlementAgent via HCS
    const settlementTopicId = process.env.SETTLEMENT_TOPIC_ID
    if (!settlementTopicId) {
      throw new Error('Missing SETTLEMENT_TOPIC_ID')
    }

    // Use the SettlementAgent's HCS client to send the message
    const hcsClient = new HCS10Client(
      process.env.HEDERA_ACCOUNT_ID!,
      process.env.HEDERA_PRIVATE_KEY!,
      'testnet'
    )

    await hcsClient.sendMessage(settlementTopicId, JSON.stringify(verificationResult))
    console.log(chalk.green('✓ Verification result sent to SettlementAgent'))
    console.log(`📡 Topic: ${settlementTopicId}`)

    console.log(chalk.bold('--- Waiting for Payment Execution ---'))
    console.log(chalk.yellow('⏳ SettlementAgent should now execute x402 payment...'))
    
    // Wait for the SettlementAgent to process the message
    await new Promise(resolve => setTimeout(resolve, 15000))

    console.log(chalk.bold('--- Payment Execution Complete ---'))
    console.log(chalk.green('✅ Check the following for transaction details:'))
    console.log(chalk.blue('📡 HashScan Settlement Topic:'))
    console.log(`   https://hashscan.io/testnet/topic/${settlementTopicId}`)
    console.log(chalk.blue('🌐 BaseScan (for x402 payment):'))
    console.log('   https://sepolia.basescan.org')
    console.log(chalk.blue('💰 Settlement Wallet:'))
    console.log(`   ${process.env.SETTLEMENT_WALLET_PRIVATE_KEY?.substring(0, 10)}...`)
    console.log(chalk.blue('🏪 Merchant Wallet:'))
    console.log(`   ${process.env.MERCHANT_WALLET_ADDRESS}`)
    console.log(chalk.blue('💵 USDC Contract:'))
    console.log(`   ${process.env.USDC_CONTRACT}`)

  } catch (error) {
    console.error(chalk.red('❌ Direct payment test failed:'), error)
    throw error
  }
}

// Run the test
testDirectPayment()
  .then(() => {
    console.log(chalk.green('\n🎉 Direct payment test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Direct payment test failed:'), error)
    process.exit(1)
  })
