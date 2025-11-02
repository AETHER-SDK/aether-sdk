import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface X402PaymentAuthorization {
  x402Version: number
  scheme: string
  network: string
  payload: {
    signature: string
    authorization: {
      from: string
      to: string
      value: string
      validAfter: number
      validBefore: number
      nonce: string
    }
  }
}

class X402PaymentServer {
  private provider: ethers.JsonRpcProvider
  private usdcContract: ethers.Contract

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    
    const usdcAbi = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ]
    
    this.usdcContract = new ethers.Contract(
      process.env.USDC_CONTRACT!,
      usdcAbi,
      this.provider
    )
  }

  async executePayment(authorization: X402PaymentAuthorization): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(chalk.bold('🔧 Executing x402 Payment Authorization'))
      console.log('')

      const { authorization: auth } = authorization.payload
      
      console.log('Payment Details:')
      console.log(`  From: ${auth.from}`)
      console.log(`  To: ${auth.to}`)
      console.log(`  Value: ${auth.value} (${ethers.formatUnits(auth.value, 6)} USDC)`)
      console.log(`  Valid Until: ${new Date(auth.validBefore * 1000).toISOString()}`)
      console.log(`  Nonce: ${auth.nonce}`)
      console.log('')

      // Verify the authorization is still valid
      const currentTime = Math.floor(Date.now() / 1000)
      if (currentTime > auth.validBefore) {
        return { success: false, error: 'Payment authorization has expired' }
      }

      // Check if the payer has sufficient USDC balance
      const payerBalance = await (this.usdcContract as any).balanceOf(auth.from)
      if (payerBalance < auth.value) {
        return { success: false, error: 'Insufficient USDC balance' }
      }

      console.log(chalk.yellow('📤 Executing USDC transfer...'))
      
      // Create a wallet for the payer (in a real implementation, this would be the payer's wallet)
      const payerWallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, this.provider)
      const usdcContractWithSigner = this.usdcContract.connect(payerWallet)
      
      // Execute the transfer
      const tx = await (usdcContractWithSigner as any).transfer(auth.to, auth.value)
      
      console.log(chalk.blue('📋 Transaction Hash:'), tx.hash)
      console.log(chalk.yellow('⏳ Waiting for confirmation...'))
      
      const receipt = await tx.wait()
      
      console.log(chalk.green('✅ Payment executed successfully!'))
      console.log(chalk.blue('📋 Block Number:'), receipt.blockNumber)
      console.log(chalk.blue('⛽ Gas Used:'), receipt.gasUsed.toString())
      
      return { success: true, txHash: tx.hash }

    } catch (error) {
      console.error(chalk.red('❌ Payment execution failed:'), error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

async function testX402ServerImplementation(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Testing x402 Server Implementation'))
    console.log(chalk.gray('This will create a payment authorization and execute it via x402 server'))
    console.log('')

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    const wallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, provider)
    
    console.log(chalk.bold('--- Creating x402 Payment Authorization ---'))
    
    // Create a payment authorization (simulating what processPayment would create)
    const authorization: X402PaymentAuthorization = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base-sepolia',
      payload: {
        signature: '0x' + '0'.repeat(130), // Placeholder signature
        authorization: {
          from: await wallet.getAddress(),
          to: process.env.MERCHANT_WALLET_ADDRESS!,
          value: '1000000', // 1 USDC
          validAfter: 0,
          validBefore: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
          nonce: ethers.hexlify(ethers.randomBytes(32))
        }
      }
    }

    console.log('Authorization created:', JSON.stringify(authorization, null, 2))
    console.log('')

    console.log(chalk.bold('--- Executing Payment via x402 Server ---'))
    
    const server = new X402PaymentServer()
    const result = await server.executePayment(authorization)
    
    console.log('')
    console.log(chalk.bold('--- Payment Result ---'))
    
    if (result.success) {
      console.log(chalk.green('✅ Payment executed successfully!'))
      console.log(chalk.blue('📋 Transaction Hash:'), result.txHash)
      console.log('')
      console.log(chalk.bold('--- Monitoring Links ---'))
      console.log(chalk.blue('🌐 BaseScan Transaction:'))
      console.log(`   https://sepolia.basescan.org/tx/${result.txHash}`)
      console.log(chalk.blue('🔍 Settlement Wallet:'))
      console.log(`   https://sepolia.basescan.org/address/${await wallet.getAddress()}`)
      console.log(chalk.blue('🔍 Merchant Wallet:'))
      console.log(`   https://sepolia.basescan.org/address/${process.env.MERCHANT_WALLET_ADDRESS}`)
    } else {
      console.log(chalk.red('❌ Payment failed:'), result.error)
    }

  } catch (error) {
    console.error(chalk.red('❌ x402 server test failed:'), error)
    throw error
  }
}

// Run the test
testX402ServerImplementation()
  .then(() => {
    console.log(chalk.green('\n🎉 x402 server implementation test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 x402 server test failed:'), error)
    process.exit(1)
  })
