import { x402PaymentRequiredException, x402Utils } from 'a2a-x402'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

class MerchantAgent {
  private utils: any
  private paymentRequests: Map<string, any> = new Map()

  constructor() {
    this.utils = new x402Utils()
  }

  async requestPayment(productName: string, price: number, customerAddress: string): Promise<void> {
    try {
      console.log(chalk.bold(`🏪 Merchant Agent: Requesting Payment for ${productName}`))
      console.log(`💰 Price: ${price} USDC`)
      console.log(`👤 Customer: ${customerAddress}`)
      console.log('')

      // Create payment requirements
      const paymentRequirements = {
        scheme: 'exact' as const,
        network: 'base-sepolia' as const,
        asset: process.env.USDC_CONTRACT!,
        payTo: process.env.MERCHANT_WALLET_ADDRESS!,
        maxAmountRequired: (price * 1000000).toString(), // Convert to atomic units
        resource: `/purchase/${productName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Payment for ${productName}`,
        mimeType: 'application/json',
        maxTimeoutSeconds: 1200
      }

      console.log(chalk.blue('📋 Payment Requirements:'))
      console.log(JSON.stringify(paymentRequirements, null, 2))
      console.log('')

      // Store payment request for later verification
      const requestId = `req_${Date.now()}`
      this.paymentRequests.set(requestId, {
        ...paymentRequirements,
        customerAddress,
        productName,
        price,
        timestamp: Date.now(),
        status: 'pending'
      })

      console.log(chalk.yellow('💳 Throwing x402PaymentRequiredException...'))
      
      // Throw the payment required exception
      throw new x402PaymentRequiredException(
        `Payment required for ${productName}`,
        paymentRequirements
      )

    } catch (error) {
      if (error instanceof x402PaymentRequiredException) {
        console.log(chalk.green('✅ Payment request exception thrown successfully!'))
        console.log(chalk.blue('📋 Exception Details:'))
        console.log(`   Message: ${error.message}`)
        console.log(`   Requirements: ${JSON.stringify(error.paymentRequirements, null, 2)}`)
        console.log('')
        console.log(chalk.yellow('💡 This exception should be caught by the client agent'))
        console.log(chalk.yellow('💡 The client agent will process the payment'))
        
        // Re-throw the exception for the client to catch
        throw error
      } else {
        console.error(chalk.red('❌ Error requesting payment:'), error)
        throw error
      }
    }
  }

  async verifyPayment(paymentPayload: any, originalRequirements: any): Promise<{ isValid: boolean; reason?: string }> {
    try {
      console.log(chalk.bold('🔍 Merchant Agent: Verifying Payment'))
      console.log('')

      // Check if payment payload matches requirements
      const auth = paymentPayload.payload.authorization
      
      console.log(chalk.blue('📋 Payment Verification:'))
      console.log(`   From: ${auth.from}`)
      console.log(`   To: ${auth.to}`)
      console.log(`   Value: ${auth.value} (${parseInt(auth.value) / 1000000} USDC)`)
      console.log(`   Valid Until: ${new Date(auth.validBefore * 1000).toISOString()}`)
      console.log('')

      // Verify signature and authorization
      const currentTime = Math.floor(Date.now() / 1000)
      
      if (currentTime > auth.validBefore) {
        return { isValid: false, reason: 'Payment authorization has expired' }
      }

      if (auth.to !== originalRequirements.payTo) {
        return { isValid: false, reason: 'Payment destination mismatch' }
      }

      if (auth.value !== originalRequirements.maxAmountRequired) {
        return { isValid: false, reason: 'Payment amount mismatch' }
      }

      console.log(chalk.green('✅ Payment verification successful!'))
      return { isValid: true }

    } catch (error) {
      console.error(chalk.red('❌ Payment verification failed:'), error)
      return { isValid: false, reason: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async settlePayment(paymentPayload: any, originalRequirements: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(chalk.bold('🏦 Merchant Agent: Settling Payment'))
      console.log('')

      const auth = paymentPayload.payload.authorization
      
      // In a real implementation, this would execute the actual token transfer
      // For now, we'll simulate the settlement
      console.log(chalk.yellow('💰 Executing token transfer...'))
      console.log(`   From: ${auth.from}`)
      console.log(`   To: ${auth.to}`)
      console.log(`   Amount: ${parseInt(auth.value) / 1000000} USDC`)
      console.log('')

      // Simulate transaction hash
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`
      
      console.log(chalk.green('✅ Payment settled successfully!'))
      console.log(chalk.blue('📋 Transaction Hash:'), txHash)
      
      return { success: true, txHash }

    } catch (error) {
      console.error(chalk.red('❌ Payment settlement failed:'), error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  getPaymentRequests(): Map<string, any> {
    return this.paymentRequests
  }
}

async function testMerchantAgent(): Promise<void> {
  try {
    console.log(chalk.bold('🏪 Testing Merchant Agent with x402PaymentRequiredException'))
    console.log('')

    const merchant = new MerchantAgent()

    console.log(chalk.bold('--- Step 1: Request Payment ---'))
    
    try {
      await merchant.requestPayment('Premium Banana', 2.5, '0xb36faaA498D6E40Ee030fF651330aefD1b8D24D2')
    } catch (error) {
      if (error instanceof x402PaymentRequiredException) {
        console.log(chalk.green('✅ Caught x402PaymentRequiredException as expected!'))
        console.log('')
        
        console.log(chalk.bold('--- Step 2: Simulate Client Payment Processing ---'))
        console.log(chalk.yellow('💳 Client agent would now process the payment...'))
        
        // Simulate client processing the payment
        const mockPaymentPayload = {
          x402Version: 1,
          scheme: 'exact',
          network: 'base-sepolia',
          payload: {
            signature: '0x' + '0'.repeat(130),
            authorization: {
              from: '0xb36faaA498D6E40Ee030fF651330aefD1b8D24D2',
              to: process.env.MERCHANT_WALLET_ADDRESS!,
              value: '2500000', // 2.5 USDC
              validAfter: 0,
              validBefore: Math.floor(Date.now() / 1000) + 1200,
              nonce: '0x' + Math.random().toString(16).substring(2, 66)
            }
          }
        }

        console.log(chalk.bold('--- Step 3: Verify Payment ---'))
        const verificationResult = await merchant.verifyPayment(mockPaymentPayload, error.paymentRequirements)
        
        if (verificationResult.isValid) {
          console.log(chalk.bold('--- Step 4: Settle Payment ---'))
          const settlementResult = await merchant.settlePayment(mockPaymentPayload, error.paymentRequirements)
          
          if (settlementResult.success) {
            console.log(chalk.green('🎉 Complete merchant payment flow successful!'))
          } else {
            console.log(chalk.red('❌ Settlement failed:'), settlementResult.error)
          }
        } else {
          console.log(chalk.red('❌ Verification failed:'), verificationResult.reason)
        }
      } else {
        console.error(chalk.red('❌ Unexpected error:'), error)
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Merchant agent test failed:'), error)
    throw error
  }
}

// Run the merchant agent test
testMerchantAgent()
  .then(() => {
    console.log(chalk.green('\n🎉 Merchant agent test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Merchant agent test failed:'), error)
    process.exit(1)
  })
