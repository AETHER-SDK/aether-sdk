/**
 * Integration Tests for AP2 Payment Protocol
 * 
 * Tests AP2 payment creation, validation, and processing
 */

import { AP2Protocol, AP2PaymentRequest } from '../../src/protocols/AP2Protocol'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

async function testAP2Protocol() {
  console.log(chalk.bold.cyan('\n🧪 Testing AP2 Payment Protocol\n'))

  try {
    // Test 1: Create AP2 Payment Request
    console.log(chalk.blue('📝 Test 1: Create AP2 Payment Request'))
    
    const paymentRequest = AP2Protocol.createPaymentRequest(
      'pay-123',
      '1000000', // 1 USDC
      'USDC',
      process.env.MERCHANT_WALLET_ADDRESS || '0x1234...',
      'base-sepolia',
      {
        purpose: 'NFT royalty payment',
        reference: 'NFT-12345',
        description: 'Royalty for NFT sale #12345'
      }
    )

    console.log(chalk.green('✅ Payment request created'))
    console.log(chalk.gray(`   Payment ID: ${paymentRequest.paymentId}`))
    console.log(chalk.gray(`   Amount: ${paymentRequest.amount} ${paymentRequest.currency}`))
    console.log(chalk.gray(`   Network: ${paymentRequest.network}`))

    // Test 2: Validate Valid Payment Request
    console.log(chalk.blue('\n📝 Test 2: Validate Valid Payment Request'))
    
    const validation = AP2Protocol.validatePaymentRequest(paymentRequest)
    
    if (validation.valid) {
      console.log(chalk.green('✅ Payment request is valid'))
    } else {
      console.log(chalk.red(`❌ Payment validation failed: ${validation.error}`))
    }

    // Test 3: Validate Invalid Payment (Wrong Amount)
    console.log(chalk.blue('\n📝 Test 3: Validate Invalid Payment (Wrong Amount)'))
    
    const invalidAmount = { ...paymentRequest, amount: 'invalid' }
    const validationInvalid = AP2Protocol.validatePaymentRequest(invalidAmount)
    
    if (!validationInvalid.valid) {
      console.log(chalk.green('✅ Invalid amount correctly rejected'))
    } else {
      console.log(chalk.red('❌ Should have rejected invalid amount'))
    }

    // Test 4: Validate Expired Payment
    console.log(chalk.blue('\n📝 Test 4: Validate Expired Payment'))
    
    const expiredPayment = {
      ...paymentRequest,
      expiry: Date.now() - 1000 // Expired 1 second ago
    }
    const validationExpired = AP2Protocol.validatePaymentRequest(expiredPayment)
    
    if (!validationExpired.valid) {
      console.log(chalk.green('✅ Expired payment correctly rejected'))
    } else {
      console.log(chalk.red('❌ Should have rejected expired payment'))
    }

    // Test 5: Create Payment Response
    console.log(chalk.blue('\n📝 Test 5: Create Payment Response'))
    
    const paymentResponse = AP2Protocol.createPaymentResponse(
      'pay-123',
      'completed',
      '0xabc123...',
      undefined
    )

    console.log(chalk.green('✅ Payment response created'))
    console.log(chalk.gray(`   Status: ${paymentResponse.status}`))
    console.log(chalk.gray(`   Transaction: ${paymentResponse.transactionHash}`))

    // Test 6: Check Payment Match
    console.log(chalk.blue('\n📝 Test 6: Check Payment Match'))
    
    const matches = AP2Protocol.matches(paymentRequest, paymentResponse)
    
    if (matches) {
      console.log(chalk.green('✅ Payment request and response match'))
    } else {
      console.log(chalk.red('❌ Payment request and response do not match'))
    }

    console.log(chalk.bold.green('\n✅ All AP2 Payment Tests Passed!\n'))

  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${(error as Error).message}\n`))
    process.exit(1)
  }
}

// Run tests
testAP2Protocol()

