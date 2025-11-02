import { Client, PrivateKey, AccountId, TopicCreateTransaction, AccountUpdateTransaction } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Simplified HCS-11 Profile Setup Script
 * 
 * This script creates a proper HCS-11 setup by:
 * 1. Creating a topic for profile data
 * 2. Setting account memo to point to that topic
 * 3. Using the correct HCS-11 format: hcs-11:hcs://1/{topicId}
 */
async function setupHCS11Profile(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Setting up HCS-11 Profile'))
    console.log(chalk.gray('Creating proper HCS-11 profile setup for account 0.0.7132337'))
    console.log('')

    // Initialize Hedera client
    const client = Client.forTestnet()
    
    const accountId = process.env.HEDERA_ACCOUNT_ID!
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY!
    
    console.log(chalk.blue('Account ID:'), accountId)
    console.log(chalk.blue('Private Key:'), privateKeyString.substring(0, 20) + '...')
    console.log('')

    // Parse private key
    let privateKey: PrivateKey
    try {
      privateKey = PrivateKey.fromString(privateKeyString)
    } catch (error) {
      console.error(chalk.red('❌ Error parsing private key:'), error)
      return
    }

    // Set operator
    client.setOperator(AccountId.fromString(accountId), privateKey)
    
    console.log(chalk.bold('--- Step 1: Creating Profile Topic ---'))
    
    // Create a topic for the profile data
    const topicTransaction = new TopicCreateTransaction()
      .setTopicMemo('HCS-11 Profile Topic for Agent Coordinator')
      .setAdminKey(privateKey.publicKey)
      .setSubmitKey(privateKey.publicKey)
    
    console.log(chalk.yellow('Creating profile topic...'))
    const topicResponse = await topicTransaction.execute(client)
    const topicReceipt = await topicResponse.getReceipt(client)
    const profileTopicId = topicReceipt.topicId!
    
    console.log(chalk.green('✅ Profile topic created:'))
    console.log(`   Topic ID: ${profileTopicId}`)
    console.log(`   HashScan: https://hashscan.io/testnet/topic/${profileTopicId}`)
    console.log('')

    console.log(chalk.bold('--- Step 2: Updating Account Memo ---'))
    
    // Update account memo to point to the profile topic using correct HCS-11 format
    const memo = `hcs-11:hcs://1/${profileTopicId}`
    console.log(chalk.yellow('Setting account memo:'), memo)
    console.log(chalk.gray('Format: hcs-11:hcs://1/{topicId}'))
    
    const accountUpdateTransaction = new AccountUpdateTransaction()
      .setAccountId(accountId)
      .setAccountMemo(memo)
    
    console.log(chalk.yellow('Executing account update transaction...'))
    const updateResponse = await accountUpdateTransaction.execute(client)
    const updateReceipt = await updateResponse.getReceipt(client)
    
    console.log(chalk.green('✅ Account memo updated successfully!'))
    console.log('')

    console.log(chalk.bold('--- Step 3: Adding Profile Data to Topic ---'))
    
    // Add some basic profile data to the topic
    const profileData = {
      name: 'Agent Coordinator',
      description: 'Main coordinator account for Hedron system',
      version: '1.0.0',
      capabilities: ['coordinate', 'manage', 'orchestrate'],
      properties: {
        accountType: 'coordinator',
        network: 'testnet',
        system: 'hedron'
      },
      bio: 'Agent Coordinator - Main account for managing Hedron agent operations',
      type: 'coordinator',
      model: 'agent-coordinator-2024'
    }
    
    console.log(chalk.yellow('Adding profile data to topic...'))
    console.log(chalk.gray('Profile data:'), JSON.stringify(profileData, null, 2))
    
    // For now, we'll just log the profile data
    // In a full implementation, you would submit this as a message to the topic
    console.log(chalk.blue('📝 Profile data prepared for topic inscription'))
    console.log(chalk.blue('💡 Note: Full profile inscription requires additional HCS-11 client setup'))
    console.log('')

    console.log(chalk.bold('--- Verification ---'))
    console.log(chalk.green('✅ HCS-11 profile setup completed:'))
    console.log(`   Account ID: ${accountId}`)
    console.log(`   Profile Topic: ${profileTopicId}`)
    console.log(`   Account Memo: ${memo}`)
    console.log('')
    console.log(chalk.blue('🔗 Monitoring Links:'))
    console.log(`   Account: https://hashscan.io/testnet/account/${accountId}`)
    console.log(`   Profile Topic: https://hashscan.io/testnet/topic/${profileTopicId}`)
    console.log('')
    console.log(chalk.green('💡 The account memo now follows HCS-11 standard format!'))
    console.log(chalk.yellow('⚠️  Note: Full profile retrieval may require additional profile inscription'))

  } catch (error) {
    console.error(chalk.red('❌ Error setting up HCS-11 profile:'), error)
    throw error
  }
}

// Run the profile setup
setupHCS11Profile()
  .then(() => {
    console.log(chalk.green('\n🎉 HCS-11 profile setup completed!'))
    console.log(chalk.green('The account memo now follows the correct HCS-11 format.'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 HCS-11 profile setup failed:'), error)
    process.exit(1)
  })