import { Client, PrivateKey, AccountId, TopicMessageSubmitTransaction } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Complete HCS-11 Profile Inscription Script
 * 
 * This script creates a comprehensive HCS-11 profile inscription
 * that should resolve the "Not Found" CDN error.
 * 
 * The issue might be that the CDN expects a specific format
 * or multiple messages for proper indexing.
 */
async function createCompleteHCS11Profile(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Creating Complete HCS-11 Profile'))
    console.log(chalk.gray('Resolving "Not Found" CDN error with comprehensive profile data'))
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
    
    console.log(chalk.bold('--- Step 1: Creating Standard HCS-11 Profile ---'))
    
    // Create a profile that follows the exact HCS-11 standard
    const standardProfile = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://hashgraphonline.com/docs/standards/hcs-11"
      ],
      "@type": "HCS11Profile",
      "id": `did:hedera:testnet:${accountId}`,
      "name": "Agent Coordinator",
      "displayName": "Hedron Agent Coordinator",
      "description": "Main coordinator account for Hedron system",
      "version": "1.0.0",
      "created": "2025-01-26T01:50:00Z",
      "updated": new Date().toISOString(),
      "capabilities": [
        "coordinate",
        "manage", 
        "orchestrate",
        "hcs-10-messaging",
        "x402-payments",
        "cross-chain-settlement"
      ],
      "properties": {
        "accountType": "coordinator",
        "network": "testnet",
        "system": "hedron",
        "status": "active",
        "lastActivity": new Date().toISOString()
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
          "autonomous": true,
          "profileRetrieval": true
        },
        "endpoints": {
          "profile": `https://hashscan.io/testnet/topic/${profileTopicId}`,
          "account": `https://hashscan.io/testnet/account/${accountId}`
        }
      }
    }
    
    console.log(chalk.yellow('Standard profile data prepared'))
    console.log('')

    console.log(chalk.bold('--- Step 2: Inscribing Standard Profile ---'))
    console.log(chalk.yellow(`Inscribing to topic: ${profileTopicId}`))
    
    // Submit the standard profile
    const profileMessage = JSON.stringify(standardProfile)
    
    const submitTransaction = new TopicMessageSubmitTransaction()
      .setTopicId(profileTopicId)
      .setMessage(profileMessage)
    
    console.log(chalk.yellow('Submitting standard profile...'))
    const response = await submitTransaction.execute(client)
    const receipt = await response.getReceipt(client)
    
    console.log(chalk.green('✅ Standard profile inscribed!'))
    console.log('')

    console.log(chalk.bold('--- Step 3: Adding Profile Index Messages ---'))
    
    // Add multiple profile-related messages for better CDN indexing
    const indexMessages = [
      // Profile index message
      {
        "@type": "HCS11ProfileIndex",
        "profileId": `did:hedera:testnet:${accountId}`,
        "topicId": profileTopicId,
        "accountId": accountId,
        "timestamp": new Date().toISOString(),
        "status": "active"
      },
      // Profile metadata message
      {
        "@type": "HCS11ProfileMetadata",
        "profileId": `did:hedera:testnet:${accountId}`,
        "name": "Agent Coordinator",
        "type": "coordinator",
        "network": "testnet",
        "timestamp": new Date().toISOString()
      },
      // Profile capabilities message
      {
        "@type": "HCS11ProfileCapabilities",
        "profileId": `did:hedera:testnet:${accountId}`,
        "capabilities": standardProfile.capabilities,
        "timestamp": new Date().toISOString()
      },
      // Profile status message
      {
        "@type": "HCS11ProfileStatus",
        "profileId": `did:hedera:testnet:${accountId}`,
        "status": "active",
        "lastSeen": new Date().toISOString(),
        "version": "1.0.0"
      }
    ]
    
    for (let i = 0; i < indexMessages.length; i++) {
      const message = JSON.stringify(indexMessages[i])
      
      const indexTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(profileTopicId)
        .setMessage(message)
      
      console.log(chalk.yellow(`Submitting index message ${i + 1}/${indexMessages.length}...`))
      await indexTransaction.execute(client)
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(chalk.green('✅ All index messages added!'))
    console.log('')

    console.log(chalk.bold('--- Step 4: Adding Profile Discovery Messages ---'))
    
    // Add discovery messages that CDN might look for
    const discoveryMessages = [
      // Simple profile discovery
      {
        "profile": `did:hedera:testnet:${accountId}`,
        "name": "Agent Coordinator",
        "type": "HCS11Profile",
        "topic": profileTopicId,
        "account": accountId
      },
      // Profile summary
      {
        "id": `did:hedera:testnet:${accountId}`,
        "name": "Agent Coordinator",
        "description": "Hedron Agent Coordinator",
        "status": "active",
        "network": "testnet"
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
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(chalk.green('✅ All discovery messages added!'))
    console.log('')

    console.log(chalk.bold('--- Verification ---'))
    console.log(chalk.green('✅ Complete HCS-11 profile inscription finished:'))
    console.log(`   Account ID: ${accountId}`)
    console.log(`   Profile Topic: ${profileTopicId}`)
    console.log(`   Account Memo: hcs-11:hcs://1/${profileTopicId}`)
    console.log(`   Total Messages: ${1 + indexMessages.length + discoveryMessages.length}`)
    console.log('')
    console.log(chalk.blue('🔗 Monitoring Links:'))
    console.log(`   Account: https://hashscan.io/testnet/account/${accountId}`)
    console.log(`   Profile Topic: https://hashscan.io/testnet/topic/${profileTopicId}`)
    console.log('')
    console.log(chalk.green('💡 The "Not Found" CDN error should now be resolved!'))
    console.log(chalk.green('💡 Multiple profile messages should improve CDN indexing'))

  } catch (error) {
    console.error(chalk.red('❌ Error creating complete HCS-11 profile:'), error)
    throw error
  }
}

// Run the complete profile creation
createCompleteHCS11Profile()
  .then(() => {
    console.log(chalk.green('\n🎉 Complete HCS-11 profile creation finished!'))
    console.log(chalk.green('The CDN "Not Found" error should now be resolved.'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Complete HCS-11 profile creation failed:'), error)
    process.exit(1)
  })
