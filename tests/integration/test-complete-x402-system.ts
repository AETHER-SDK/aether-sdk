import { x402PaymentRequiredException, processPayment, x402Utils } from 'a2a-x402'
import { X402FacilitatorServer } from '../../src/facilitator/X402FacilitatorServer'
import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface PaymentState {
  id: string
  requirements: any
  payload?: any
  status: 'initiated' | 'processing' | 'verified' | 'settled' | 'failed'
  timestamp: number
  txHash?: string
  error?: string
  metadata?: any
}

class CompleteX402System {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private utils: any
  private paymentStates: Map<string, PaymentState> = new Map()
  private facilitator: X402FacilitatorServer

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    this.wallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, this.provider)
    this.utils = new x402Utils()
    this.facilitator = new X402FacilitatorServer()
  }

  // Merchant Agent: Request Payment
  async requestPayment(productName: string, price: number): Promise<any> {
    console.log(chalk.bold(`🏪 Merchant: Requesting Payment for ${productName}`))
    console.log(`💰 Price: ${price} USDC`)
    console.log('')

    const requirements = {
      scheme: 'exact' as const,
      network: 'base-sepolia' as const,
      asset: process.env.USDC_CONTRACT!,
      payTo: process.env.MERCHANT_WALLET_ADDRESS!,
      maxAmountRequired: (price * 1000000).toString(),
      resource: `/purchase/${productName.toLowerCase().replace(/\s+/g, '-')}`,
      description: `Payment for ${productName}`,
      mimeType: 'application/json',
      maxTimeoutSeconds: 1200
    }

    // Store payment state
    const paymentId = `payment_${Date.now()}`
    this.paymentStates.set(paymentId, {
      id: paymentId,
      requirements,
      status: 'initiated',
      timestamp: Date.now(),
      metadata: { productName, price }
    })

    console.log(chalk.blue('📋 Payment Requirements:'))
    console.log(JSON.stringify(requirements, null, 2))
    console.log('')

    // Throw payment required exception
    throw new x402PaymentRequiredException(
      `Payment required for ${productName}`,
      requirements
    )
  }

  // Client Agent: Process Payment
  async processPayment(requirements: any): Promise<any> {
    console.log(chalk.bold('💳 Client: Processing Payment'))
    console.log('')

    try {
      console.log(chalk.yellow('💰 Creating payment authorization...'))
      const paymentPayload = await processPayment(requirements, this.wallet)
      
      console.log(chalk.green('✅ Payment authorization created!'))
      console.log(chalk.blue('📋 Payment Payload:'))
      console.log(JSON.stringify(paymentPayload, null, 2))
      console.log('')

      return paymentPayload

    } catch (error) {
      console.error(chalk.red('❌ Payment processing failed:'), error)
      throw error
    }
  }

  // Server: Verify Payment
  async verifyPayment(paymentPayload: any, requirements: any): Promise<{ isValid: boolean; reason?: string }> {
    console.log(chalk.bold('🔍 Server: Verifying Payment'))
    console.log('')

    try {
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
      const verificationResult = await this.facilitator.verify(paymentHeader, requirements)
      
      if (verificationResult.isValid) {
        console.log(chalk.green('✅ Payment verification successful!'))
        return { isValid: true }
      } else {
        console.log(chalk.red('❌ Payment verification failed:'), verificationResult.invalidReason)
        return { isValid: false, reason: verificationResult.invalidReason || 'Verification failed' }
      }

    } catch (error) {
      console.error(chalk.red('❌ Verification error:'), error)
      return { isValid: false, reason: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Server: Settle Payment
  async settlePayment(paymentPayload: any, requirements: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
    console.log(chalk.bold('🏦 Server: Settling Payment'))
    console.log('')

    try {
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
      const settlementResult = await this.facilitator.settle(paymentHeader, requirements)
      
      if (settlementResult.success) {
        console.log(chalk.green('✅ Payment settlement successful!'))
        console.log(chalk.blue('📋 Transaction Hash:'), settlementResult.txHash)
        return { success: true, txHash: settlementResult.txHash || 'unknown' }
      } else {
        console.log(chalk.red('❌ Payment settlement failed:'), settlementResult.error)
        return { success: false, error: settlementResult.error || 'Settlement failed' }
      }

    } catch (error) {
      console.error(chalk.red('❌ Settlement error:'), error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Complete Payment Flow
  async executeCompletePaymentFlow(productName: string, price: number): Promise<void> {
    try {
      console.log(chalk.bold('🚀 Complete X402 Payment Flow'))
      console.log(chalk.gray('Merchant → Client → Server → Settlement'))
      console.log('')

      // Step 1: Merchant requests payment
      console.log(chalk.bold('--- Step 1: Merchant Requests Payment ---'))
      let requirements: any
      try {
        await this.requestPayment(productName, price)
      } catch (error) {
        if (error instanceof x402PaymentRequiredException) {
          console.log(chalk.green('✅ Payment request exception caught!'))
          requirements = error.paymentRequirements[0] // Get first requirement
        } else {
          throw error
        }
      }

      // Step 2: Client processes payment
      console.log(chalk.bold('--- Step 2: Client Processes Payment ---'))
      const paymentPayload = await this.processPayment(requirements)

      // Step 3: Server verifies payment
      console.log(chalk.bold('--- Step 3: Server Verifies Payment ---'))
      const verificationResult = await this.verifyPayment(paymentPayload, requirements)
      
      if (!verificationResult.isValid) {
        console.log(chalk.red('❌ Payment verification failed, stopping flow'))
        return
      }

      // Step 4: Server settles payment
      console.log(chalk.bold('--- Step 4: Server Settles Payment ---'))
      const settlementResult = await this.settlePayment(paymentPayload, requirements)
      
      if (settlementResult.success) {
        console.log(chalk.green('🎉 Complete payment flow successful!'))
        console.log(chalk.blue('📋 Final Transaction Hash:'), settlementResult.txHash)
      } else {
        console.log(chalk.red('❌ Payment settlement failed:'), settlementResult.error)
      }

    } catch (error) {
      console.error(chalk.red('❌ Complete payment flow failed:'), error)
      throw error
    }
  }

  // Get payment statistics
  getPaymentStats(): { total: number; byStatus: Record<string, number> } {
    const payments = Array.from(this.paymentStates.values())
    const byStatus: Record<string, number> = {}
    
    payments.forEach(payment => {
      byStatus[payment.status] = (byStatus[payment.status] || 0) + 1
    })
    
    return {
      total: payments.length,
      byStatus
    }
  }
}

async function testCompleteX402System(): Promise<void> {
  try {
    console.log(chalk.bold('🎯 Testing Complete X402 System'))
    console.log(chalk.gray('All improvements integrated: Exception flow, Server verification, State management'))
    console.log('')

    const system = new CompleteX402System()

    console.log(chalk.bold('--- Test 1: Premium Product Payment ---'))
    await system.executeCompletePaymentFlow('Premium Banana', 2.5)

    console.log('')
    console.log(chalk.bold('--- Test 2: Standard Product Payment ---'))
    await system.executeCompletePaymentFlow('Standard Apple', 1.0)

    console.log('')
    console.log(chalk.bold('--- Payment Statistics ---'))
    const stats = system.getPaymentStats()
    console.log(`   Total Payments: ${stats.total}`)
    console.log('   By Status:')
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`)
    })

  } catch (error) {
    console.error(chalk.red('❌ Complete X402 system test failed:'), error)
    throw error
  }
}

// Run the complete system test
testCompleteX402System()
  .then(() => {
    console.log(chalk.green('\n🎉 Complete X402 system test completed!'))
    console.log(chalk.blue('🔗 Based on: https://github.com/dabit3/a2a-x402-typescript'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Complete X402 system test failed:'), error)
    process.exit(1)
  })
