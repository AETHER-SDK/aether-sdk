import { x402Utils } from 'a2a-x402'
import { X402FacilitatorServer } from '../../src/facilitator/X402FacilitatorServer'
import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface PaymentRecord {
  id: string
  requirements: any
  payload?: any
  status: 'pending' | 'verified' | 'settled' | 'failed'
  timestamp: number
  txHash?: string
  error?: string
}

class X402PaymentServer {
  private provider: ethers.JsonRpcProvider
  private usdcContract: ethers.Contract
  private utils: any
  private payments: Map<string, PaymentRecord> = new Map()
  private facilitator: X402FacilitatorServer

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
    
    this.utils = new x402Utils()
    this.facilitator = new X402FacilitatorServer()
  }

  async processPayment(paymentPayload: any, requirements: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(chalk.bold('🏦 X402 Payment Server: Processing Payment'))
      console.log('')

      const paymentId = `payment_${Date.now()}`
      
      // Store payment record
      const paymentRecord: PaymentRecord = {
        id: paymentId,
        requirements,
        payload: paymentPayload,
        status: 'pending',
        timestamp: Date.now()
      }
      
      this.payments.set(paymentId, paymentRecord)
      
      console.log(chalk.blue('📋 Payment Details:'))
      console.log(`   ID: ${paymentId}`)
      console.log(`   From: ${paymentPayload.payload.authorization.from}`)
      console.log(`   To: ${paymentPayload.payload.authorization.to}`)
      console.log(`   Amount: ${parseInt(paymentPayload.payload.authorization.value) / 1000000} USDC`)
      console.log('')

      // Step 1: Verify Payment
      console.log(chalk.bold('--- Step 1: Verify Payment ---'))
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
      const verificationResult = await this.facilitator.verify(paymentHeader, requirements)
      
      if (!verificationResult.isValid) {
        paymentRecord.status = 'failed'
        paymentRecord.error = verificationResult.invalidReason || 'Verification failed'
        console.log(chalk.red('❌ Payment verification failed:'), verificationResult.invalidReason)
        return { success: false, error: verificationResult.invalidReason || 'Verification failed' }
      }
      
      console.log(chalk.green('✅ Payment verification successful!'))
      paymentRecord.status = 'verified'

      // Step 2: Settle Payment
      console.log(chalk.bold('--- Step 2: Settle Payment ---'))
      const settlementResult = await this.facilitator.settle(paymentHeader, requirements)
      
      if (!settlementResult.success) {
        paymentRecord.status = 'failed'
        paymentRecord.error = settlementResult.error || 'Settlement failed'
        console.log(chalk.red('❌ Payment settlement failed:'), settlementResult.error)
        return { success: false, error: settlementResult.error || 'Settlement failed' }
      }
      
      console.log(chalk.green('✅ Payment settlement successful!'))
      paymentRecord.status = 'settled'
      paymentRecord.txHash = settlementResult.txHash || 'unknown'

      // Step 3: Execute Actual Token Transfer
      console.log(chalk.bold('--- Step 3: Execute Token Transfer ---'))
      const actualTxHash = await this.executeTokenTransfer(paymentPayload)
      
      if (actualTxHash) {
        paymentRecord.txHash = actualTxHash
        console.log(chalk.green('✅ Token transfer executed!'))
        console.log(chalk.blue('📋 Transaction Hash:'), actualTxHash)
      }

      return { success: true, txHash: actualTxHash || 'unknown' }

    } catch (error) {
      console.error(chalk.red('❌ Payment processing failed:'), error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async executeTokenTransfer(paymentPayload: any): Promise<string | null> {
    try {
      const auth = paymentPayload.payload.authorization
      
      // Check payer balance
      const payerBalance = await (this.usdcContract as any).balanceOf(auth.from)
      if (payerBalance < auth.value) {
        throw new Error('Insufficient USDC balance')
      }

      // Create wallet for payer (in real implementation, this would be the payer's wallet)
      const payerWallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, this.provider)
      const usdcContractWithSigner = this.usdcContract.connect(payerWallet)
      
      // Execute transfer
      const tx = await (usdcContractWithSigner as any).transfer(auth.to, auth.value)
      await tx.wait()
      
      return tx.hash

    } catch (error) {
      console.error(chalk.red('❌ Token transfer failed:'), error)
      return null
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentRecord | null> {
    return this.payments.get(paymentId) || null
  }

  getAllPayments(): PaymentRecord[] {
    return Array.from(this.payments.values())
  }

  async getPaymentStats(): Promise<{ total: number; pending: number; verified: number; settled: number; failed: number }> {
    const payments = this.getAllPayments()
    
    return {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      verified: payments.filter(p => p.status === 'verified').length,
      settled: payments.filter(p => p.status === 'settled').length,
      failed: payments.filter(p => p.status === 'failed').length
    }
  }
}

async function testX402PaymentServer(): Promise<void> {
  try {
    console.log(chalk.bold('🏦 Testing X402 Payment Server'))
    console.log(chalk.gray('Complete server-side verification and settlement'))
    console.log('')

    const server = new X402PaymentServer()

    // Create mock payment payload
    const mockPaymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base-sepolia',
      payload: {
        signature: '0x' + '0'.repeat(130),
        authorization: {
          from: '0x63DB480bDA35b5D9AD029cDd0829fc5AC75e6261',
          to: process.env.MERCHANT_WALLET_ADDRESS!,
          value: '1500000', // 1.5 USDC
          validAfter: 0,
          validBefore: Math.floor(Date.now() / 1000) + 1200,
          nonce: '0x' + Math.random().toString(16).substring(2, 66)
        }
      }
    }

    const requirements = {
      scheme: 'exact',
      network: 'base-sepolia',
      asset: process.env.USDC_CONTRACT!,
      payTo: process.env.MERCHANT_WALLET_ADDRESS!,
      maxAmountRequired: '1500000',
      resource: '/test-payment',
      description: 'Test payment',
      mimeType: 'application/json',
      maxTimeoutSeconds: 1200
    }

    console.log(chalk.bold('--- Processing Payment ---'))
    const result = await server.processPayment(mockPaymentPayload, requirements)
    
    console.log('')
    console.log(chalk.bold('--- Payment Result ---'))
    if (result.success) {
      console.log(chalk.green('✅ Payment processed successfully!'))
      console.log(chalk.blue('📋 Transaction Hash:'), result.txHash)
    } else {
      console.log(chalk.red('❌ Payment processing failed:'), result.error)
    }

    console.log('')
    console.log(chalk.bold('--- Payment Statistics ---'))
    const stats = await server.getPaymentStats()
    console.log(`   Total Payments: ${stats.total}`)
    console.log(`   Pending: ${stats.pending}`)
    console.log(`   Verified: ${stats.verified}`)
    console.log(`   Settled: ${stats.settled}`)
    console.log(`   Failed: ${stats.failed}`)

  } catch (error) {
    console.error(chalk.red('❌ Payment server test failed:'), error)
    throw error
  }
}

// Run the payment server test
testX402PaymentServer()
  .then(() => {
    console.log(chalk.green('\n🎉 Payment server test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Payment server test failed:'), error)
    process.exit(1)
  })
