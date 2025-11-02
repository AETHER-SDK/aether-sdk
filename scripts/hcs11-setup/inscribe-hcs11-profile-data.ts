import { Client, PrivateKey, AccountId, TopicMessageSubmitTransaction } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * HCS-11 Profile Data Inscription Script
 * 
 * This script properly inscribes profile data to the HCS-11 topic
 * to resolve the "Failed to fetch profile from Kiloscribe CDN" error.
 * 
 * The HCS-11 standard requires actual profile data to be inscribed
 * in the topic that the account memo points to.
 */
async function inscribeHCS11ProfileData(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Inscribing HCS-11 Profile Data'))
    console.log(chalk.gray('Adding actual profile data to resolve CDN fetch error'))
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
    
    // The profile topic ID from our previous setup
    const profileTopicId = '0.0.7133161'
    
    console.log(chalk.bold('--- Step 1: Preparing Profile Data ---'))
    
    // Create comprehensive profile data following HCS-11 standard
    const profileData = {
      "@context": "https://hashgraphonline.com/docs/standards/hcs-11",
      "@type": "HCS11Profile",
      "id": `hedera:testnet:account:${accountId}`,
      "name": "Agent Coordinator",
      "displayName": "Hedron Agent Coordinator",
      "description": "Main coordinator account for Hedron system",
      "version": "1.0.0",
      "capabilities": [
        "coordinate",
        "manage", 
        "orchestrate",
        "hcs-10-messaging",
        "x402-payments"
      ],
      "properties": {
        "accountType": "coordinator",
        "network": "testnet",
        "system": "hedron",
        "created": "2025-01-26T01:50:00Z",
        "lastUpdated": new Date().toISOString(),
        "status": "active"
      },
      "bio": "Agent Coordinator - Main account for managing Hedron agent operations and cross-chain payments",
      "type": "coordinator",
      "model": "agent-coordinator-2024",
      "members": [],
      "threshold": 1,
      "topics": [
        "0.0.7132813", // Main coordination topic
        "0.0.7132818", // Verifier topic
        "0.0.7132822"  // Settlement topic
      ],
      "metadata": {
        "agentSystem": "hedron",
        "version": "1.0.0",
        "capabilities": {
          "hcs10": true,
          "x402": true,
          "crossChain": true,
          "autonomous": true
        }
      }
    }
    
    console.log(chalk.yellow('Profile data prepared:'))
    console.log(chalk.gray(JSON.stringify(profileData, null, 2)))
    console.log('')

    console.log(chalk.bold('--- Step 2: Inscribing Profile Data to Topic ---'))
    console.log(chalk.yellow(`Inscribing to topic: ${profileTopicId}`))
    
    // Submit profile data as a message to the topic
    const profileMessage = JSON.stringify(profileData)
    
    const submitTransaction = new TopicMessageSubmitTransaction()
      .setTopicId(profileTopicId)
      .setMessage(profileMessage)
    
    console.log(chalk.yellow('Submitting profile data to topic...'))
    const response = await submitTransaction.execute(client)
    const receipt = await response.getReceipt(client)
    
    console.log(chalk.green('✅ Profile data inscribed successfully!'))
    console.log(`   Topic ID: ${profileTopicId}`)
    console.log(`   Message Size: ${profileMessage.length} bytes`)
    console.log('')

    console.log(chalk.bold('--- Step 3: Adding Additional Profile Messages ---'))
    
    // Add a few more profile-related messages for completeness
    const additionalMessages = [
      {
        "@type": "HCS11ProfileUpdate",
        "timestamp": new Date().toISOString(),
        "status": "active",
        "capabilities": profileData.capabilities
      },
      {
        "@type": "HCS11ProfileMetadata",
        "timestamp": new Date().toISOString(),
        "system": "hedron",
        "version": "1.0.0"
      }
    ]
    
    for (let i = 0; i < additionalMessages.length; i++) {
      const message = JSON.stringify(additionalMessages[i])
      
      const additionalTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(profileTopicId)
        .setMessage(message)
      
      console.log(chalk.yellow(`Submitting additional message ${i + 1}...`))
      await additionalTransaction.execute(client)
    }
    
    console.log(chalk.green('✅ Additional profile messages added!'))
    console.log('')

    console.log(chalk.bold('--- Verification ---'))
    console.log(chalk.green('✅ HCS-11 profile data inscription completed:'))
    console.log(`   Account ID: ${accountId}`)
    console.log(`   Profile Topic: ${profileTopicId}`)
    console.log(`   Account Memo: hcs-11:hcs://1/${profileTopicId}`)
    console.log(`   Profile Messages: ${additionalMessages.length + 1}`)
    console.log('')
    console.log(chalk.blue('🔗 Monitoring Links:'))
    console.log(`   Account: https://hashscan.io/testnet/account/${accountId}`)
    console.log(`   Profile Topic: https://hashscan.io/testnet/topic/${profileTopicId}`)
    console.log('')
    console.log(chalk.green('💡 The CDN fetch error should now be resolved!'))
    console.log(chalk.green('💡 Profile data is now properly inscribed in the topic'))

  } catch (error) {
    console.error(chalk.red('❌ Error inscribing HCS-11 profile data:'), error)
    throw error
  }
}

// Run the profile inscription
inscribeHCS11ProfileData()
  .then(() => {
    console.log(chalk.green('\n🎉 HCS-11 profile data inscription completed!'))
    console.log(chalk.green('The CDN fetch error should now be resolved.'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 HCS-11 profile data inscription failed:'), error)
    process.exit(1)
  })
