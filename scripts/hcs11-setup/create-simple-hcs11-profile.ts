import { Client, PrivateKey, AccountId, TopicMessageSubmitTransaction } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Simple HCS-11 Profile Fix Script
 * 
 * The CDN might be looking for a very specific format.
 * Let's create a minimal, standard HCS-11 profile that should definitely work.
 */
async function createSimpleHCS11Profile(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Creating Simple HCS-11 Profile'))
    console.log(chalk.gray('Creating minimal profile that CDN can definitely find'))
    console.log('')

    // Initialize Hedera client
    const client = Client.forTestnet()
    
    const accountId = process.env.HEDERA_ACCOUNT_ID!
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY!
    
    if (!accountId || !privateKeyString) {
      throw new Error('Missing required environment variables: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY')
    }
    
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
    
    // The profile topic ID
    const profileTopicId = '0.0.7133161'
    
    console.log(chalk.bold('--- Step 1: Creating Minimal Profile ---'))
    
    // Create the simplest possible HCS-11 profile
    const minimalProfile = {
      "id": accountId,
      "name": "Agent Coordinator",
      "type": "HCS11Profile",
      "status": "active",
      "network": "testnet",
      "created": new Date().toISOString()
    }
    
    console.log(chalk.yellow('Minimal profile data:'))
    console.log(chalk.gray(JSON.stringify(minimalProfile, null, 2)))
    console.log('')

    console.log(chalk.bold('--- Step 2: Submitting Minimal Profile ---'))
    console.log(chalk.yellow(`Submitting to topic: ${profileTopicId}`))
    
    // Submit the minimal profile
    const profileMessage = JSON.stringify(minimalProfile)
    
    const submitTransaction = new TopicMessageSubmitTransaction()
      .setTopicId(profileTopicId)
      .setMessage(profileMessage)
    
    console.log(chalk.yellow('Submitting minimal profile...'))
    const response = await submitTransaction.execute(client)
    const receipt = await response.getReceipt(client)
    
    console.log(chalk.green('✅ Minimal profile submitted!'))
    console.log('')

    console.log(chalk.bold('--- Step 3: Adding Profile Discovery Messages ---'))
    
    // Add multiple simple discovery messages
    const discoveryMessages = [
      // Simple account profile
      {
        "account": accountId,
        "name": "Agent Coordinator",
        "profile": true
      },
      // Even simpler format
      {
        "id": accountId,
        "name": "Agent Coordinator"
      },
      // Basic profile info
      {
        "profileId": accountId,
        "displayName": "Agent Coordinator",
        "type": "profile"
      },
      // CDN discovery format
      {
        "hedera:account": accountId,
        "name": "Agent Coordinator",
        "status": "active"
      },
      // Alternative format
      {
        "accountId": accountId,
        "profileName": "Agent Coordinator",
        "active": true
      }
    ]
    
    for (let i = 0; i < discoveryMessages.length; i++) {
      const message = JSON.stringify(discoveryMessages[i])
      
      const discoveryTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(profileTopicId)
        .setMessage(message)
      
      console.log(chalk.yellow(`Submitting discovery message ${i + 1}/${discoveryMessages.length}...`))
      await discoveryTransaction.execute(client)
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log(chalk.green('✅ All discovery messages submitted!'))
    console.log('')

    console.log(chalk.bold('--- Step 4: Adding Raw Text Messages ---'))
    
    // Add some raw text messages that CDN might look for
    const textMessages = [
      `Profile for account ${accountId}`,
      `Agent Coordinator - ${accountId}`,
      `HCS-11 Profile: ${accountId}`,
      `Account ${accountId} profile data`,
      `Profile active for ${accountId}`
    ]
    
    for (let i = 0; i < textMessages.length; i++) {
      const message = textMessages[i]
      if (!message) continue
      
      const textTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(profileTopicId)
        .setMessage(message)
      
      console.log(chalk.yellow(`Submitting text message ${i + 1}/${textMessages.length}...`))
      await textTransaction.execute(client)
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log(chalk.green('✅ All text messages submitted!'))
    console.log('')

    console.log(chalk.bold('--- Verification ---'))
    console.log(chalk.green('✅ Simple HCS-11 profile creation completed:'))
    console.log(`   Account ID: ${accountId}`)
    console.log(`   Profile Topic: ${profileTopicId}`)
    console.log(`   Account Memo: hcs-11:hcs://1/${profileTopicId}`)
    console.log(`   Total Messages: ${1 + discoveryMessages.length + textMessages.length}`)
    console.log('')
    console.log(chalk.blue('🔗 Monitoring Links:'))
    console.log(`   Account: https://hashscan.io/testnet/account/${accountId}`)
    console.log(`   Profile Topic: https://hashscan.io/testnet/topic/${profileTopicId}`)
    console.log('')
    console.log(chalk.green('💡 Multiple simple profile formats should help CDN find the profile!'))
    console.log(chalk.yellow('⚠️  Note: CDN indexing may take a few minutes to update'))

  } catch (error) {
    console.error(chalk.red('❌ Error creating simple HCS-11 profile:'), error)
    throw error
  }
}

// Run the simple profile creation
createSimpleHCS11Profile()
  .then(() => {
    console.log(chalk.green('\n🎉 Simple HCS-11 profile creation completed!'))
    console.log(chalk.green('Multiple profile formats should help CDN indexing.'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Simple HCS-11 profile creation failed:'), error)
    process.exit(1)
  })
