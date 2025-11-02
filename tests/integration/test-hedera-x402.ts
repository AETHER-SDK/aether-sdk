import { SettlementAgent } from '../../src/agents/SettlementAgent'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Integration test for Hedera X402 payment flow
 * 
 * This test validates:
 * - Hedera payment requirement creation
 * - Hedera payment authorization
 * - Hedera payment verification
 * - Hedera payment settlement (HBAR transfer)
 */
async function testHederaX402Payment() {
  try {
    console.log(chalk.bold('🧪 Hedera X402 Payment Integration Test'))
    console.log('')

    // Check environment
    if (process.env.PAYMENT_NETWORK !== 'hedera-testnet') {
      console.log(chalk.yellow('⚠️  Setting PAYMENT_NETWORK=hedera-testnet for this test'))
      process.env.PAYMENT_NETWORK = 'hedera-testnet'
    }

    const hbarAmount = parseFloat(process.env.HBAR_PAYMENT_AMOUNT || '10')
    const merchantAccount = process.env.HEDERA_MERCHANT_ACCOUNT_ID
    const settlementWallet = process.env.HEDERA_ACCOUNT_ID

    if (!merchantAccount || !settlementWallet) {
      throw new Error('Missing Hedera environment variables: HEDERA_MERCHANT_ACCOUNT_ID and HEDERA_ACCOUNT_ID')
    }

    console.log(chalk.blue('📋 Test Configuration:'))
    console.log(`   Network: Hedera Testnet`)
    console.log(`   Amount: ${hbarAmount} HBAR`)
    console.log(`   From: ${settlementWallet}`)
    console.log(`   To: ${merchantAccount}`)
    console.log('')

    // Initialize SettlementAgent
    console.log(chalk.blue('🔄 Initializing SettlementAgent...'))
    const settlementAgent = new SettlementAgent()
    await settlementAgent.init()
    console.log(chalk.green('✅ SettlementAgent initialized'))
    console.log('')

    // Create verification result
    console.log(chalk.blue('📋 Creating verification result...'))
    const verificationResult = {
      type: 'verification_result',
      agentId: process.env.VERIFIER_AGENT_ID || 'verifier-agent',
      proposalId: `test_proposal_${Date.now()}`,
      approved: true,
      reasoning: `Test payment for ${hbarAmount} HBAR on Hedera`,
      paymentDetails: {
        amount: hbarAmount.toString(),
        asset: 'HBAR',
        payTo: merchantAccount
      }
    }

    console.log(chalk.green('✅ Verification result created'))
    console.log('')

    // Execute payment
    console.log(chalk.blue('💰 Executing Hedera payment...'))
    console.log(chalk.gray('   This will:'))
    console.log(chalk.gray('   1. Create payment authorization'))
    console.log(chalk.gray('   2. Verify payment via facilitator'))
    console.log(chalk.gray('   3. Settle payment and execute HBAR transfer'))
    console.log('')

    await settlementAgent.triggerSettlement(verificationResult)

    console.log('')
    console.log(chalk.green('✅ Test completed successfully!'))
    console.log('')
    console.log(chalk.blue('📋 Summary:'))
    console.log(chalk.green('   ✓ Hedera payment requirement created'))
    console.log(chalk.green('   ✓ Payment authorization generated'))
    console.log(chalk.green('   ✓ Payment verification passed'))
    console.log(chalk.green('   ✓ Payment settled (HBAR transfer executed)'))
    console.log('')
    console.log(chalk.blue('💡 Check HashScan for the transaction:'))
    console.log(chalk.gray(`   https://hashscan.io/testnet/search/${merchantAccount}`))
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error)
    console.log('')
    console.log(chalk.yellow('💡 Troubleshooting:'))
    console.log(chalk.gray('   1. Check HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY are set'))
    console.log(chalk.gray('   2. Check HEDERA_MERCHANT_ACCOUNT_ID is set'))
    console.log(chalk.gray('   3. Ensure Settlement Agent has sufficient HBAR balance'))
    console.log(chalk.gray('   4. Verify PAYMENT_NETWORK=hedera-testnet is set'))
    console.log('')
    process.exit(1)
  }
}

// Run the test
testHederaX402Payment()

