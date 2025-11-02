import { x402Utils } from 'a2a-x402'
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

class EnhancedX402Utils {
  private utils: any
  private paymentStates: Map<string, PaymentState> = new Map()
  private paymentHistory: PaymentState[] = []

  constructor() {
    this.utils = new x402Utils()
  }

  // Initialize a new payment
  initiatePayment(requirements: any, metadata?: any): string {
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    const paymentState: PaymentState = {
      id: paymentId,
      requirements,
      status: 'initiated',
      timestamp: Date.now(),
      metadata
    }
    
    this.paymentStates.set(paymentId, paymentState)
    this.paymentHistory.push(paymentState)
    
    console.log(chalk.blue('📋 Payment Initiated:'))
    console.log(`   ID: ${paymentId}`)
    console.log(`   Amount: ${parseInt(requirements.maxAmountRequired) / 1000000} USDC`)
    console.log(`   To: ${requirements.payTo}`)
    console.log(`   Resource: ${requirements.resource}`)
    
    return paymentId
  }

  // Update payment status
  updatePaymentStatus(paymentId: string, status: PaymentState['status'], payload?: any, txHash?: string, error?: string): void {
    const payment = this.paymentStates.get(paymentId)
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`)
    }
    
    payment.status = status
    if (payload) payment.payload = payload
    if (txHash) payment.txHash = txHash
    if (error) payment.error = error
    
    console.log(chalk.yellow(`📊 Payment Status Updated:`))
    console.log(`   ID: ${paymentId}`)
    console.log(`   Status: ${status}`)
    if (txHash) console.log(`   TX: ${txHash}`)
    if (error) console.log(`   Error: ${error}`)
  }

  // Get payment status
  getPaymentStatus(paymentId: string): PaymentState | null {
    return this.paymentStates.get(paymentId) || null
  }

  // Get all payments
  getAllPayments(): PaymentState[] {
    return Array.from(this.paymentStates.values())
  }

  // Get payments by status
  getPaymentsByStatus(status: PaymentState['status']): PaymentState[] {
    return this.getAllPayments().filter(p => p.status === status)
  }

  // Get payment statistics
  getPaymentStats(): { total: number; byStatus: Record<string, number>; totalVolume: number } {
    const payments = this.getAllPayments()
    const byStatus: Record<string, number> = {}
    
    let totalVolume = 0
    
    payments.forEach(payment => {
      byStatus[payment.status] = (byStatus[payment.status] || 0) + 1
      if (payment.status === 'settled') {
        totalVolume += parseInt(payment.requirements.maxAmountRequired) / 1000000
      }
    })
    
    return {
      total: payments.length,
      byStatus,
      totalVolume
    }
  }

  // Record payment success
  recordPaymentSuccess(paymentId: string, txHash: string, settlementData?: any): void {
    this.updatePaymentStatus(paymentId, 'settled', undefined, txHash)
    
    const payment = this.paymentStates.get(paymentId)
    if (payment && settlementData) {
      payment.metadata = { ...payment.metadata, settlementData }
    }
    
    console.log(chalk.green('✅ Payment Success Recorded:'))
    console.log(`   ID: ${paymentId}`)
    console.log(`   TX: ${txHash}`)
  }

  // Record payment failure
  recordPaymentFailure(paymentId: string, error: string): void {
    this.updatePaymentStatus(paymentId, 'failed', undefined, undefined, error)
    
    console.log(chalk.red('❌ Payment Failure Recorded:'))
    console.log(`   ID: ${paymentId}`)
    console.log(`   Error: ${error}`)
  }

  // Get payment requirements from task/context
  getPaymentRequirements(task: any): any {
    // This would extract payment requirements from a task context
    // For now, we'll return a mock implementation
    return {
      scheme: 'exact',
      network: 'base-sepolia',
      asset: process.env.USDC_CONTRACT!,
      payTo: process.env.MERCHANT_WALLET_ADDRESS!,
      maxAmountRequired: '1000000',
      resource: '/service',
      description: 'Service payment',
      mimeType: 'application/json',
      maxTimeoutSeconds: 1200
    }
  }

  // Check if payment is required for a task
  isPaymentRequired(task: any): boolean {
    // Check if task contains payment requirements
    return task && task.paymentRequired === true
  }

  // Get payment history
  getPaymentHistory(limit?: number): PaymentState[] {
    const history = [...this.paymentHistory].reverse()
    return limit ? history.slice(0, limit) : history
  }

  // Clean up old payments
  cleanupOldPayments(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const cutoff = Date.now() - maxAge
    const toDelete: string[] = []
    
    this.paymentStates.forEach((payment, id) => {
      if (payment.timestamp < cutoff && (payment.status === 'settled' || payment.status === 'failed')) {
        toDelete.push(id)
      }
    })
    
    toDelete.forEach(id => {
      this.paymentStates.delete(id)
    })
    
    console.log(chalk.yellow(`🧹 Cleaned up ${toDelete.length} old payments`))
  }

  // Export payment data
  exportPaymentData(): string {
    const data = {
      payments: this.getAllPayments(),
      stats: this.getPaymentStats(),
      exportTime: new Date().toISOString()
    }
    
    return JSON.stringify(data, null, 2)
  }
}

async function testEnhancedX402Utils(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Testing Enhanced x402Utils'))
    console.log(chalk.gray('Complete payment state management'))
    console.log('')

    const utils = new EnhancedX402Utils()

    console.log(chalk.bold('--- Step 1: Initiate Multiple Payments ---'))
    
    const payment1 = utils.initiatePayment({
      scheme: 'exact',
      network: 'base-sepolia',
      asset: process.env.USDC_CONTRACT!,
      payTo: process.env.MERCHANT_WALLET_ADDRESS!,
      maxAmountRequired: '1000000',
      resource: '/product-1',
      description: 'Product 1 payment',
      mimeType: 'application/json',
      maxTimeoutSeconds: 1200
    }, { productName: 'Product 1', customerId: 'customer-123' })

    const payment2 = utils.initiatePayment({
      scheme: 'exact',
      network: 'base-sepolia',
      asset: process.env.USDC_CONTRACT!,
      payTo: process.env.MERCHANT_WALLET_ADDRESS!,
      maxAmountRequired: '2500000',
      resource: '/product-2',
      description: 'Product 2 payment',
      mimeType: 'application/json',
      maxTimeoutSeconds: 1200
    }, { productName: 'Product 2', customerId: 'customer-456' })

    console.log('')
    console.log(chalk.bold('--- Step 2: Update Payment Statuses ---'))
    
    utils.updatePaymentStatus(payment1, 'processing')
    utils.updatePaymentStatus(payment2, 'processing')
    
    // Simulate successful settlement for payment1
    utils.recordPaymentSuccess(payment1, '0x' + Math.random().toString(16).substring(2, 66))
    
    // Simulate failure for payment2
    utils.recordPaymentFailure(payment2, 'Insufficient balance')

    console.log('')
    console.log(chalk.bold('--- Step 3: Payment Statistics ---'))
    const stats = utils.getPaymentStats()
    console.log(`   Total Payments: ${stats.total}`)
    console.log(`   Total Volume: ${stats.totalVolume} USDC`)
    console.log('   By Status:')
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`)
    })

    console.log('')
    console.log(chalk.bold('--- Step 4: Payment History ---'))
    const history = utils.getPaymentHistory(5)
    history.forEach(payment => {
      console.log(`   ${payment.id}: ${payment.status} - ${parseInt(payment.requirements.maxAmountRequired) / 1000000} USDC`)
    })

    console.log('')
    console.log(chalk.bold('--- Step 5: Export Data ---'))
    const exportData = utils.exportPaymentData()
    console.log(chalk.blue('📋 Exported Payment Data:'))
    console.log(exportData.substring(0, 200) + '...')

  } catch (error) {
    console.error(chalk.red('❌ Enhanced x402Utils test failed:'), error)
    throw error
  }
}

// Run the enhanced utils test
testEnhancedX402Utils()
  .then(() => {
    console.log(chalk.green('\n🎉 Enhanced x402Utils test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Enhanced x402Utils test failed:'), error)
    process.exit(1)
  })
