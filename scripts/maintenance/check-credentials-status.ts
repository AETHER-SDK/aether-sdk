import { Client, AccountInfoQuery, AccountId } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config()

interface CredentialStatus {
  name: string
  accountId: string
  status: 'active' | 'inactive' | 'error' | 'unknown'
  balance?: string
  memo?: string
  error?: string
}

/**
 * Credentials Management and Status Checker
 * 
 * This script helps manage and verify all credentials in the Hedron system.
 * It checks the status of the main account and all agent accounts.
 */
async function checkCredentialsStatus(): Promise<void> {
  try {
    console.log(chalk.bold('🔍 Hedron - Credentials Status Check'))
    console.log(chalk.gray('Checking all account credentials and status...'))
    console.log('')

    // Initialize Hedera client
    const client = Client.forTestnet()
    
    const accountId = process.env.HEDERA_ACCOUNT_ID!
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY!
    
    if (!accountId || !privateKeyString) {
      throw new Error('Missing required environment variables: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY')
    }

    // Parse private key
    let privateKey
    try {
      privateKey = privateKeyString
      client.setOperator(AccountId.fromString(accountId), privateKey)
    } catch (error) {
      throw new Error(`Invalid private key format: ${error}`)
    }

    const credentials: CredentialStatus[] = []

    // Check main account
    console.log(chalk.bold('--- Main Hedera Account ---'))
    try {
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
      
      const status: CredentialStatus = {
        name: 'Main Account',
        accountId: accountId,
        status: 'active',
        balance: accountInfo.balance.toString(),
        memo: accountInfo.accountMemo || '(empty)'
      }
      
      credentials.push(status)
      
      console.log(chalk.green('✅ Main Account Status:'))
      console.log(`   Account ID: ${accountId}`)
      console.log(`   Balance: ${accountInfo.balance} tinybars`)
      console.log(`   Memo: ${accountInfo.accountMemo || '(empty)'}`)
      console.log(`   Key: ${accountInfo.key?.toString().substring(0, 20)}...`)
      
      // Check HCS-11 memo format
      if (accountInfo.accountMemo) {
        if (accountInfo.accountMemo.startsWith('hcs-11:hcs://1/')) {
          console.log(chalk.green('✅ HCS-11 memo format is correct'))
          console.log(chalk.green('   Format: hcs-11:hcs://1/{topicId}'))
        } else if (accountInfo.accountMemo.startsWith('HCS-11:profile:')) {
          console.log(chalk.yellow('⚠️  HCS-11 memo format needs updating'))
          console.log(chalk.yellow('   Current:', accountInfo.accountMemo))
          console.log(chalk.yellow('   Required: hcs-11:hcs://1/{topicId}'))
        } else if (accountInfo.accountMemo.startsWith('HCS-11:') || accountInfo.accountMemo.startsWith('hcs-11:')) {
          console.log(chalk.yellow('⚠️  HCS-11 memo format needs updating'))
          console.log(chalk.yellow('   Current:', accountInfo.accountMemo))
          console.log(chalk.yellow('   Required: hcs-11:hcs://1/{topicId}'))
        } else {
          console.log(chalk.red('❌ Account memo is not HCS-11 format'))
        }
      } else {
        console.log(chalk.red('❌ Account has no memo set'))
      }
      
    } catch (error) {
      const status: CredentialStatus = {
        name: 'Main Account',
        accountId: accountId,
        status: 'error',
        error: (error as Error).message
      }
      credentials.push(status)
      console.log(chalk.red('❌ Main Account Error:'), (error as Error).message)
    }

    console.log('')

    // Check agent accounts
    console.log(chalk.bold('--- Agent Accounts ---'))
    const agents = [
      { name: 'AnalyzerAgent', envKey: 'ANALYZER_AGENT_ID' },
      { name: 'VerifierAgent', envKey: 'VERIFIER_AGENT_ID' },
      { name: 'SettlementAgent', envKey: 'SETTLEMENT_AGENT_ID' }
    ]

    for (const agent of agents) {
      const agentId = process.env[agent.envKey]
      
      if (!agentId) {
        console.log(chalk.yellow(`⚠️  ${agent.name}: No account ID in environment`))
        continue
      }

      try {
        const accountInfo = await new AccountInfoQuery()
          .setAccountId(agentId)
          .execute(client)
        
        const status: CredentialStatus = {
          name: agent.name,
          accountId: agentId,
          status: 'active',
          balance: accountInfo.balance.toString(),
          memo: accountInfo.accountMemo || '(empty)'
        }
        
        credentials.push(status)
        
        console.log(chalk.green(`✅ ${agent.name} Status:`))
        console.log(`   Account ID: ${agentId}`)
        console.log(`   Balance: ${accountInfo.balance} tinybars`)
        console.log(`   Memo: ${accountInfo.accountMemo || '(empty)'}`)
        
      } catch (error) {
        const status: CredentialStatus = {
          name: agent.name,
          accountId: agentId,
          status: 'error',
          error: (error as Error).message
        }
        credentials.push(status)
        console.log(chalk.red(`❌ ${agent.name} Error:`), (error as Error).message)
      }
    }

    console.log('')

    // Check HCS topics
    console.log(chalk.bold('--- HCS Topics ---'))
    const topics = [
      { name: 'Main Topic', envKey: 'VERIFIER_TOPIC_ID' },
      { name: 'Analyzer Topic', envKey: 'ANALYZER_TOPIC_ID' },
      { name: 'Verifier Topic', envKey: 'VERIFIER_TOPIC_ID' },
      { name: 'Settlement Topic', envKey: 'SETTLEMENT_TOPIC_ID' }
    ]

    for (const topic of topics) {
      const topicId = process.env[topic.envKey]
      if (topicId) {
        console.log(chalk.blue(`📡 ${topic.name}: ${topicId}`))
        console.log(`   HashScan: https://hashscan.io/testnet/topic/${topicId}`)
      } else {
        console.log(chalk.yellow(`⚠️  ${topic.name}: No topic ID in environment`))
      }
    }

    console.log('')

    // Summary
    console.log(chalk.bold('--- Summary ---'))
    const activeAccounts = credentials.filter(c => c.status === 'active').length
    const errorAccounts = credentials.filter(c => c.status === 'error').length
    
    console.log(chalk.green(`✅ Active Accounts: ${activeAccounts}`))
    console.log(chalk.red(`❌ Error Accounts: ${errorAccounts}`))
    console.log(chalk.blue(`📊 Total Checked: ${credentials.length}`))

    // Recommendations
    console.log('')
    console.log(chalk.bold('--- Recommendations ---'))
    
    const mainAccount = credentials.find(c => c.name === 'Main Account')
    if (mainAccount && mainAccount.memo && !mainAccount.memo.startsWith('HCS-11:profile:')) {
      console.log(chalk.yellow('🔧 Fix HCS-11 memo format:'))
      console.log('   npx tsx setup-hcs11-memo-fixed.ts')
    }
    
    if (errorAccounts > 0) {
      console.log(chalk.yellow('🔧 Register missing agents:'))
      console.log('   npx tsx setup/register-agents.ts')
    }
    
    console.log(chalk.blue('🧪 Test agent coordination:'))
    console.log('   npx tsx tests/e2e/test-working-coordination.ts')

  } catch (error) {
    console.error(chalk.red('❌ Credentials check failed:'), error)
    throw error
  }
}

// Run the credentials check
checkCredentialsStatus()
  .then(() => {
    console.log(chalk.green('\n🎉 Credentials status check completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Credentials check failed:'), error)
    process.exit(1)
  })
