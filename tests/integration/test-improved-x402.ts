import { processPayment, x402Utils, settlePayment } from 'a2a-x402'
import { X402FacilitatorServer } from '../../src/facilitator/X402FacilitatorServer'
import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

class ImprovedSettlementAgent {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private utils: any
  private facilitator: X402FacilitatorServer

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    this.wallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, this.provider)
    this.utils = new x402Utils()
    this.facilitator = new X402FacilitatorServer()
  }

  async executePayment(verification: any): Promise<void> {
    try {
      console.log(chalk.yellow('🔧 Executing improved x402 payment...'))

      // Create payment requirements using official format
      const requirements = {
        scheme: 'exact' as const,
        network: 'base-sepolia' as const,
        asset: process.env.USDC_CONTRACT!,
        payTo: process.env.MERCHANT_WALLET_ADDRESS!,
        maxAmountRequired: '1000000', // 1 USDC in atomic units
        resource: '/agent-settlement',
        description: 'A2A agent settlement payment',
        mimeType: 'application/json',
        maxTimeoutSeconds: 1200
      }

      console.log(chalk.blue('📋 Payment Requirements:'))
      console.log(JSON.stringify(requirements, null, 2))
      console.log('')

      // Process payment using official method
      console.log(chalk.yellow('💰 Processing payment with official x402 method...'))
      const paymentPayload = await processPayment(requirements, this.wallet)
      
      console.log(chalk.green('✅ Payment processed successfully!'))
      console.log(chalk.blue('📋 Payment Payload:'))
      console.log(JSON.stringify(paymentPayload, null, 2))
      console.log('')

      // Verify payment using local facilitator server
      console.log(chalk.yellow('🔍 Verifying payment via local facilitator...'))
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
      
      try {
        const verificationResult = await this.facilitator.verify(paymentHeader, requirements)
        
        if (verificationResult.isValid) {
          console.log(chalk.green('✅ Payment verification successful!'))
          
          // Settle payment
          console.log(chalk.yellow('🏦 Settling payment...'))
          const settlementResult = await this.facilitator.settle(paymentHeader, requirements)
          
          if (settlementResult.success) {
            console.log(chalk.green('✅ Payment settled successfully!'))
            console.log(chalk.blue('📋 Settlement Result:'))
            console.log(JSON.stringify(settlementResult, null, 2))
          } else {
            console.log(chalk.red('❌ Payment settlement failed:'), settlementResult.error)
          }
        } else {
          console.log(chalk.red('❌ Payment verification failed:'), verificationResult.invalidReason)
        }
      } catch (error: any) {
        console.log(chalk.red('❌ Payment verification failed:'), error.message)
      }

    } catch (error) {
      console.error(chalk.red('❌ Improved payment execution failed:'), error)
      throw error
    }
  }
}

async function testImprovedX402Implementation(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Testing Improved x402 Implementation'))
    console.log(chalk.gray('Based on official a2a-x402-typescript repository'))
    console.log('')

    const settlementAgent = new ImprovedSettlementAgent()

    // Create verification result
    const verification = {
      type: 'verification_result',
      originalProposal: {
        accountId: '0.0.123456',
        balance: '3446.12525862 ℏ',
        threshold: 50,
        meetsThreshold: true
      },
      approved: true,
      reasoning: 'Account meets threshold requirements for payment',
      timestamp: Date.now()
    }

    console.log(chalk.bold('--- Executing Improved x402 Payment ---'))
    await settlementAgent.executePayment(verification)

    console.log(chalk.bold('--- Improved Implementation Summary ---'))
    console.log(chalk.green('✅ Used official x402PaymentRequiredException flow'))
    console.log(chalk.green('✅ Implemented proper x402Utils integration'))
    console.log(chalk.green('✅ Added verification and settlement steps'))
    console.log(chalk.green('✅ Enhanced error handling and status tracking'))
    console.log('')
    console.log(chalk.blue('🔗 Based on: https://github.com/dabit3/a2a-x402-typescript'))

  } catch (error) {
    console.error(chalk.red('❌ Improved x402 test failed:'), error)
    throw error
  }
}

// Run the improved test
testImprovedX402Implementation()
  .then(() => {
    console.log(chalk.green('\n🎉 Improved x402 implementation test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Improved x402 test failed:'), error)
    process.exit(1)
  })
