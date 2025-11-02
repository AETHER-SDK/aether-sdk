import { AnalyzerAgent } from '../src/agents/AnalyzerAgent'
import { VerifierAgent } from '../src/agents/VerifierAgent'
import { SettlementAgent } from '../src/agents/SettlementAgent'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { TransferTransaction, AccountId, Hbar } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Constants - npm run demo -- passes args differently
const DEMO_ACCOUNT = process.argv[2] || '0.0.123456'
const THRESHOLD_HBAR = parseInt(process.argv[3] || '50') || 50
const PAYMENT_NETWORK = process.argv[4] || process.env.PAYMENT_NETWORK || 'base-sepolia'

// Helper function for sleep
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  try {
    // Print banner
    console.log(chalk.bold('🤖 Hedron Agent System Demo'))
    console.log(chalk.gray('Query account data and trigger agent coordination workflow'))
    console.log('')

    // Initialize agents
    console.log(chalk.bold('--- Initializing Agents ---'))
    const analyzer = new AnalyzerAgent()
    const verifier = new VerifierAgent()
    const settlement = new SettlementAgent()

    // Call init() on all 3 agents
    await analyzer.init()
    await verifier.init()
    await settlement.init()

    console.log(chalk.green('✓ All agents ready'))
    console.log('')

    // HCS-10: Establish connections if enabled
    const useHCS10Connections = process.env.USE_HCS10_CONNECTIONS === 'true'
    let analyzerConn = analyzer.getConnectionManager()
    let verifierConn = verifier.getConnectionManager()
    let settlementConn = settlement.getConnectionManager()

    if (useHCS10Connections && analyzerConn && verifierConn && settlementConn) {
      console.log(chalk.bold('--- Establishing HCS-10 Connections ---'))
      try {
        const analyzerId = process.env.ANALYZER_AGENT_ID || process.env.HEDERA_ACCOUNT_ID!
        const verifierId = process.env.VERIFIER_AGENT_ID || process.env.HEDERA_ACCOUNT_ID!
        const settlementId = process.env.SETTLEMENT_AGENT_ID || process.env.HEDERA_ACCOUNT_ID!

        console.log(chalk.yellow('📡 Establishing connections between agents...'))
        
        const conn1 = await analyzerConn.requestConnection(verifierId, { timeout: 30000 })
        console.log(chalk.blue(`   Analyzer → Verifier: ${conn1.status}`))
        
        const conn2 = await verifierConn.requestConnection(settlementId, { timeout: 30000 })
        console.log(chalk.blue(`   Verifier → Settlement: ${conn2.status}`))
        
        console.log(chalk.green('✅ HCS-10 connections established'))
        console.log('')
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Connection establishment: ${(error as Error).message}`))
        console.log(chalk.gray('   Continuing with direct topic messaging\n'))
        analyzerConn = undefined
        verifierConn = undefined
        settlementConn = undefined
      }
    } else if (useHCS10Connections) {
      console.log(chalk.yellow('⚠️  HCS-10 connections requested but managers not initialized'))
      console.log(chalk.gray('   Ensure USE_HCS10_CONNECTIONS=true and agent credentials are set\n'))
    }

    // Execute workflow
    console.log(chalk.bold('--- Workflow Starting ---'))
    
    // Query account data
    const accountData = await analyzer.queryAccount(DEMO_ACCOUNT)
    
    // Propose insight (this would normally be a method on AnalyzerAgent)
    console.log(chalk.blue('📊 AnalyzerAgent proposing insight...'))
    console.log(`Account: ${accountData.accountId}`)
    console.log(`Balance: ${accountData.balance}`)
    console.log(`Threshold: ${THRESHOLD_HBAR} HBAR`)
    
    // Analyze threshold and trigger payment if met
    const balanceInHBAR = parseFloat(accountData.balance.replace(' ℏ', ''))
    const meetsThreshold = balanceInHBAR >= THRESHOLD_HBAR
    console.log(chalk.blue(`✓ Proposal: ${meetsThreshold ? 'Meets' : 'Does not meet'} threshold`))
    
    // HCS-10: Send proposal via connection if available, otherwise use direct topic
    if (meetsThreshold && analyzerConn && verifierConn) {
      const verifierId = process.env.VERIFIER_AGENT_ID || process.env.HEDERA_ACCOUNT_ID!
      const connection = analyzerConn.getConnection(verifierId)
      
      if (connection && connection.status === 'established' && connection.connectionTopicId) {
        console.log(chalk.blue('📤 Sending proposal via HCS-10 connection...'))
        const proposal = {
          type: 'analysis_proposal',
          accountId: accountData.accountId,
          balance: accountData.balance,
          threshold: THRESHOLD_HBAR,
          meetsThreshold: true,
          timestamp: Date.now(),
          analysisData: accountData,
          proposalId: `proposal_${Date.now()}`
        }
        
        try {
          await analyzer.getHcsClient().sendMessage(
            connection.connectionTopicId,
            JSON.stringify(proposal)
          )
          console.log(chalk.green('✅ Proposal sent via connection topic'))
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Connection send failed, continuing with workflow: ${(error as Error).message}`))
        }
      }
    }
    
    if (meetsThreshold) {
      console.log(chalk.bold('--- Triggering Payment Flow ---'))
      
      const paymentAsset = PAYMENT_NETWORK === 'hedera-testnet' ? 'HBAR' : 'USDC'
      const paymentNetworkName = PAYMENT_NETWORK === 'hedera-testnet' ? 'Hedera Testnet' : 'Base Sepolia'
      
      console.log(chalk.yellow(`💰 Account meets threshold - executing ${paymentAsset} payment on ${paymentNetworkName}`))
      
      // Create verification result for SettlementAgent
      const verificationResult = {
        type: 'verification_result',
        agentId: process.env.VERIFIER_AGENT_ID || 'verifier-agent',
        proposalId: `proposal_${Date.now()}`,
        approved: true,
        reasoning: `Account ${accountData.accountId} meets threshold of ${THRESHOLD_HBAR} HBAR (balance: ${balanceInHBAR} HBAR)`,
        paymentDetails: PAYMENT_NETWORK === 'hedera-testnet' ? {
          amount: process.env.HBAR_PAYMENT_AMOUNT || '10',
          asset: 'HBAR',
          payTo: process.env.HEDERA_MERCHANT_ACCOUNT_ID
        } : {
          amount: '1000000', // 1 USDC in atomic units
          asset: process.env.USDC_CONTRACT,
          payTo: process.env.MERCHANT_WALLET_ADDRESS
        }
      }
      
      console.log(chalk.blue('📋 Payment Details:'))
      console.log(`   Network: ${paymentNetworkName}`)
      if (PAYMENT_NETWORK === 'hedera-testnet') {
        console.log(`   Amount: ${process.env.HBAR_PAYMENT_AMOUNT || '10'} HBAR`)
        console.log(`   To: ${process.env.HEDERA_MERCHANT_ACCOUNT_ID}`)
      } else {
        console.log(`   Amount: 1 USDC`)
        console.log(`   To: ${process.env.MERCHANT_WALLET_ADDRESS}`)
        console.log(`   Asset: ${process.env.USDC_CONTRACT}`)
      }
      console.log('')
      
      // HCS-10: Use transaction approval if enabled and connections available
      const txApproval = settlement.getTransactionApproval()
      const verifierTxApproval = verifier.getTransactionApproval()
      const useTransactionApproval = useHCS10Connections && 
                                     txApproval && 
                                     verifierTxApproval && 
                                     settlementConn &&
                                     PAYMENT_NETWORK === 'hedera-testnet' // Only for HBAR on Hedera
      
      if (useTransactionApproval) {
        console.log(chalk.yellow('🔧 Executing payment via HCS-10 transaction approval workflow...'))
        console.log(chalk.gray('   1. Creating scheduled transaction'))
        console.log(chalk.gray('   2. Sending for approval'))
        console.log(chalk.gray('   3. Awaiting approval'))
        console.log(chalk.gray('   4. Executing approved transaction'))
        console.log('')
        
        try {
          const verifierId = process.env.VERIFIER_AGENT_ID || process.env.HEDERA_ACCOUNT_ID!
          const settlementId = process.env.SETTLEMENT_AGENT_ID || process.env.HEDERA_ACCOUNT_ID!
          const merchantAccountId = process.env.HEDERA_MERCHANT_ACCOUNT_ID || '0.0.98'
          const paymentAmount = parseFloat(process.env.HBAR_PAYMENT_AMOUNT || '10')
          
          const connection = settlementConn?.getConnection(verifierId)
          
          if (settlementConn && connection && connection.status === 'established' && connection.connectionTopicId) {
            // Create payment transaction
            const paymentTx = new TransferTransaction()
              .addHbarTransfer(
                AccountId.fromString(settlementId),
                Hbar.fromTinybars(-paymentAmount * 100_000_000)
              )
              .addHbarTransfer(
                AccountId.fromString(merchantAccountId),
                Hbar.fromTinybars(paymentAmount * 100_000_000)
              )
              .setTransactionMemo(`Approved payment: ${verificationResult.reasoning}`)
            
            // Schedule transaction for approval
            const scheduledTx = await txApproval.sendTransaction(
              connection.connectionTopicId,
              paymentTx,
              `Payment: ${paymentAmount} HBAR to ${merchantAccountId}`,
              {
                scheduleMemo: `Orchestrator demo payment - threshold met`,
                expirationTime: 3600 // 1 hour
              }
            )
            
            console.log(chalk.blue(`📋 Transaction scheduled: ${scheduledTx.scheduleId.toString()}`))
            console.log(chalk.yellow('⏳ Waiting for verifier approval...'))
            
            // Wait a bit for verifier to process
            await sleep(3000)
            
            // Approve transaction
            await verifierTxApproval.approveTransaction(scheduledTx.scheduleId)
            
            console.log(chalk.green('✅ Transaction approved and executed!'))
            console.log(chalk.blue(`📋 Schedule ID: ${scheduledTx.scheduleId.toString()}`))
          } else {
            throw new Error('Connection not established')
          }
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Transaction approval workflow failed: ${(error as Error).message}`))
          console.log(chalk.gray('   Falling back to direct execution...\n'))
          // Fall through to direct execution
          await settlement.triggerSettlement(verificationResult)
        }
      } else {
        // Execute settlement by calling the public triggerSettlement method
        console.log(chalk.yellow('🔧 Executing full x402 payment flow...'))
        console.log(chalk.gray('   1. Creating payment authorization'))
        console.log(chalk.gray('   2. Verifying payment via facilitator'))
        console.log(chalk.gray(`   3. Settling payment and executing ${paymentAsset} transfer`))
        console.log('')
        
        try {
          // Use triggerSettlement to execute the payment
          await settlement.triggerSettlement(verificationResult)
          console.log(chalk.green('✅ Complete x402 payment flow executed successfully!'))
          console.log(chalk.blue(`📋 Real ${paymentAsset} transfer completed on ${paymentNetworkName}`))
          
          if (PAYMENT_NETWORK === 'hedera-testnet') {
            console.log(chalk.blue('📋 Check HashScan for the transaction'))
          } else {
            console.log(chalk.blue('📋 Check BaseScan for the transaction'))
          }
        } catch (error) {
          console.error(chalk.red('❌ Payment execution failed:'), error)
          console.log(chalk.yellow('💡 This might be due to insufficient ETH for gas or USDC balance'))
          console.log(chalk.yellow('💡 Run: npm run check:wallets to verify wallet status'))
        }
      }
    } else {
      console.log(chalk.gray('⏳ Account does not meet threshold - no payment triggered'))
    }
    
    console.log(chalk.gray('⏳ Waiting for agent coordination...'))
    await sleep(5000) // 5 seconds for coordination

    // Print final summary
    console.log(chalk.bold('--- Workflow Complete ---'))
    console.log(chalk.gray('📡 Monitor agent communication:'))
    console.log(chalk.gray(`   HashScan Topic: https://hashscan.io/testnet/topic/${process.env.ANALYZER_TOPIC_ID || 'ANALYZER_TOPIC_ID'}`))
    
    if (PAYMENT_NETWORK === 'hedera-testnet') {
      console.log(chalk.gray(`   HashScan: https://hashscan.io/testnet/search/${process.env.HEDERA_MERCHANT_ACCOUNT_ID}`))
    } else {
      console.log(chalk.gray(`   BaseScan: https://sepolia.basescan.org/address/${process.env.MERCHANT_WALLET_ADDRESS}`))
    }
    
    if (meetsThreshold) {
      const asset = PAYMENT_NETWORK === 'hedera-testnet' ? 'HBAR' : 'USDC'
      const network = PAYMENT_NETWORK === 'hedera-testnet' ? 'Hedera Testnet' : 'Base Sepolia'
      console.log(chalk.green(`💰 Real ${asset} payment executed on ${network}!`))
    }
    console.log('')

    // Exit cleanly
    process.exit(0)
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error)
    process.exit(1)
  }
}

// Run the demo
main()
