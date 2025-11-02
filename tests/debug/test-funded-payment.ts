import { processPayment } from 'a2a-x402'
import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testPaymentWithFundedWallet(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Testing x402 Payment with Funded Wallet'))
    console.log('')

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    
    // Use merchant wallet as settlement wallet for testing (it has ETH)
    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS!
    const merchantPrivateKey = process.env.SETTLEMENT_WALLET_PRIVATE_KEY! // Using settlement key for testing
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(merchantPrivateKey, provider)
    const walletAddress = await wallet.getAddress()
    
    console.log(chalk.bold('--- Wallet Status ---'))
    const ethBalance = await provider.getBalance(walletAddress)
    console.log(`Wallet Address: ${walletAddress}`)
    console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`)
    console.log('')

    // Check USDC balance
    const usdcContract = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    const usdcAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']
    const usdcContractInstance = new ethers.Contract(usdcContract, usdcAbi, provider)
    
    const usdcBalance = await (usdcContractInstance as any).balanceOf(walletAddress)
    const decimals = await (usdcContractInstance as any).decimals()
    
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, decimals)} USDC`)
    console.log('')

    if (ethBalance === 0n) {
      console.log(chalk.red('❌ Wallet has no ETH for gas fees!'))
      return
    }

    if (usdcBalance < ethers.parseUnits('10', decimals)) {
      console.log(chalk.red('❌ Wallet has insufficient USDC for payment!'))
      return
    }

    console.log(chalk.bold('--- Payment Requirements ---'))
    const requirements = {
      scheme: 'exact' as const,
      network: 'base-sepolia' as const,
      asset: usdcContract,
      payTo: merchantAddress, // Send to merchant address
      maxAmountRequired: '10000000', // 10 USDC in atomic units
      resource: '/agent-settlement',
      description: 'A2A agent settlement test',
      mimeType: 'application/json',
      maxTimeoutSeconds: 120
    }

    console.log('Requirements:', JSON.stringify(requirements, null, 2))
    console.log('')

    console.log(chalk.bold('--- Executing Payment ---'))
    console.log(chalk.yellow('🔧 Calling processPayment...'))
    
    try {
      const paymentPayload = await processPayment(requirements, wallet)
      console.log(chalk.green('✅ Payment successful!'))
      console.log('Payment payload:', paymentPayload)
      
      // Extract transaction hash
      const txHash = (paymentPayload as any).transactionHash || (paymentPayload as any).txHash || 'unknown'
      console.log(chalk.blue('📋 Transaction Hash:'), txHash)
      
      console.log(chalk.bold('--- Monitoring Links ---'))
      console.log(chalk.green('✅ Check the following for transaction details:'))
      console.log(chalk.blue('🌐 BaseScan Transaction:'))
      console.log(`   https://sepolia.basescan.org/tx/${txHash}`)
      console.log(chalk.blue('🔍 Wallet Address:'))
      console.log(`   https://sepolia.basescan.org/address/${walletAddress}`)
      
    } catch (paymentError) {
      console.log(chalk.red('❌ Payment failed:'), paymentError)
      console.log('Error details:', paymentError)
    }

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error)
  }
}

// Run the test
testPaymentWithFundedWallet()
  .then(() => {
    console.log(chalk.green('\n🎉 Payment test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Payment test failed:'), error)
    process.exit(1)
  })
