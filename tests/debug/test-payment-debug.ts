import { SettlementAgent } from '../../src/agents/SettlementAgent'
import { processPayment } from 'a2a-x402'
import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testPaymentWithErrorHandling(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Testing x402 Payment with Detailed Error Handling'))
    console.log('')

    // Initialize SettlementAgent
    const settlement = new SettlementAgent()
    await settlement.init()

    console.log(chalk.bold('--- Payment Requirements ---'))
    const requirements = {
      scheme: 'exact' as const,
      network: 'base-sepolia' as const,
      asset: process.env.USDC_CONTRACT || '',
      payTo: process.env.MERCHANT_WALLET_ADDRESS || '',
      maxAmountRequired: '10000000', // 10 USDC in atomic units
      resource: '/agent-settlement',
      description: 'A2A agent settlement',
      mimeType: 'application/json',
      maxTimeoutSeconds: 120
    }

    console.log('Requirements:', JSON.stringify(requirements, null, 2))
    console.log('')

    // Check wallet balance before payment
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    const wallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, provider)
    const balance = await provider.getBalance(await wallet.getAddress())
    
    console.log(chalk.bold('--- Wallet Status ---'))
    console.log(`Wallet Address: ${await wallet.getAddress()}`)
    console.log(`ETH Balance: ${ethers.formatEther(balance)} ETH`)
    console.log('')

    if (balance === 0n) {
      console.log(chalk.red('❌ Settlement wallet has no ETH for gas fees!'))
      console.log(chalk.yellow('💡 You need to fund the settlement wallet with ETH for gas fees'))
      console.log(`📋 Settlement Wallet: ${await wallet.getAddress()}`)
      console.log('🌐 Fund it via: https://sepolia.basescan.org/address/' + await wallet.getAddress())
      return
    }

    console.log(chalk.bold('--- Executing Payment ---'))
    console.log(chalk.yellow('🔧 Calling processPayment...'))
    
    try {
      const paymentPayload = await processPayment(requirements, wallet)
      console.log(chalk.green('✅ Payment successful!'))
      console.log('Payment payload:', paymentPayload)
    } catch (paymentError) {
      console.log(chalk.red('❌ Payment failed:'), paymentError)
      console.log('Error details:', paymentError)
    }

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error)
  }
}

// Run the test
testPaymentWithErrorHandling()
  .then(() => {
    console.log(chalk.green('\n🎉 Payment test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Payment test failed:'), error)
    process.exit(1)
  })
