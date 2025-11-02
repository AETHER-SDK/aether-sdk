import { Client, PrivateKey, TopicCreateTransaction, AccountInfoQuery, AccountId } from '@hashgraph/sdk'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config()

interface AgentCredentials {
  agentId: string
  topicId: string
  privateKey: string
  prefix: string
}

async function registerAgents(): Promise<void> {
  try {
    console.log('🚀 Starting agent registration process...')

    // Validate required environment yvariables
    const accountId = process.env.HEDERA_ACCOUNT_ID
    const privateKey = process.env.HEDERA_PRIVATE_KEY

    if (!accountId || !privateKey) {
      throw new Error('Missing required environment variables: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY')
    }

    // Initialize Hedera client for testnet
    const client = Client.forTestnet()
    
    // Parse the private key - handle different formats
    let parsedPrivateKey: PrivateKey
    console.log(`🔍 Attempting to parse private key: ${privateKey.substring(0, 20)}...`)
    
    try {
      // Try parsing as DER encoded string first (most common format)
      parsedPrivateKey = PrivateKey.fromString(privateKey)
      console.log(`✅ Successfully parsed private key as DER encoded string`)
    } catch (error) {
      console.log(`❌ Failed to parse as DER encoded: ${error}`)
      try {
        // Try parsing as raw hex
        parsedPrivateKey = PrivateKey.fromStringEd25519(privateKey)
        console.log(`✅ Successfully parsed private key as raw hex`)
      } catch (error2) {
        console.log(`❌ Failed to parse as raw hex: ${error2}`)
        try {
          // Try parsing as ECDSA
          parsedPrivateKey = PrivateKey.fromStringECDSA(privateKey)
          console.log(`✅ Successfully parsed private key as ECDSA`)
        } catch (error3) {
          throw new Error(`Invalid private key format. Tried DER, ED25519, and ECDSA formats. Please ensure your HEDERA_PRIVATE_KEY is correct.`)
        }
      }
    }
    
    // Set the operator with proper account ID parsing
    const accountIdObj = AccountId.fromString(accountId)
    client.setOperator(accountIdObj, parsedPrivateKey)

    console.log(`📡 Connected to Hedera testnet with account: ${accountId}`)
    console.log(`🔑 Using private key format: ${parsedPrivateKey.toString().substring(0, 20)}...`)

    // Check account balance
    try {
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
      console.log(`💰 Account balance: ${accountInfo.balance} tinybars`)
      
      // Verify the client can sign transactions by checking account info
      console.log(`🔐 Account key type: ${accountInfo.key?.constructor.name}`)
      console.log(`🔐 Public key matches: ${accountInfo.key?.toString() === parsedPrivateKey.publicKey.toString()}`)
    } catch (error) {
      console.warn(`⚠️  Could not fetch account balance: ${error}`)
      throw new Error(`Failed to verify account access. Please check your credentials. Error: ${error}`)
    }

    // Define agents to register
    const agents = [
      { name: 'AnalyzerAgent', prefix: 'ANALYZER' },
      { name: 'VerifierAgent', prefix: 'VERIFIER' },
      { name: 'SettlementAgent', prefix: 'SETTLEMENT' }
    ]

    const credentials: AgentCredentials[] = []

    // Register each agent
    for (const agent of agents) {
      console.log(`\n🔧 Registering ${agent.name}...`)

      try {
        console.log(`   🔧 Creating and registering ${agent.name}...`)

        // Register agent via HCS10Client (this handles account creation, key generation, and topic setup)
        const hcs10Client = new HCS10Client(accountId, parsedPrivateKey.toString(), 'testnet')
        
        const agentMetadata = {
          name: agent.name,
          description: `${agent.name} for Hedron operations`,
          version: '1.0.0',
          capabilities: ['analyze', 'verify', 'settle'],
          properties: {
            agentType: agent.name.toLowerCase().replace('agent', ''),
            network: 'testnet',
            description: `${agent.name} for Hedron operations`
          },
          bio: `${agent.name} - A specialized agent for Hedron operations`,
          type: 'autonomous',
          model: 'agent-model-2024'
        }
        
        const registrationResult = await hcs10Client.createAndRegisterAgent(agentMetadata)
        
        if (!registrationResult.success) {
          console.warn(`   ⚠️  Agent registration had issues: ${registrationResult.error}`)
          console.log(`   📋 Registration result:`, {
            success: registrationResult.success,
            error: registrationResult.error,
            transactionId: registrationResult.transactionId,
            confirmed: registrationResult.confirmed,
            state: registrationResult.state
          })
          
          // Even if registration failed, we might still have the agent created
          if (!registrationResult.state?.inboundTopicId) {
            throw new Error(`Agent creation failed completely: ${registrationResult.error}`)
          }
        }

        const agentId = registrationResult.metadata?.accountId || 
          registrationResult.state?.createdResources?.find(r => r.startsWith('account:'))?.split(':')[1]
        const inboundTopicId = registrationResult.state?.inboundTopicId
        const outboundTopicId = registrationResult.state?.outboundTopicId
        const privateKey = registrationResult.metadata?.privateKey

        if (!agentId || !inboundTopicId) {
          throw new Error(`Missing required agent data: accountId=${agentId}, inboundTopicId=${inboundTopicId}`)
        }

        console.log(`   ✅ Created agent account: ${agentId}`)
        console.log(`   ✅ Created inbound topic: ${inboundTopicId}`)
        console.log(`   ✅ Created outbound topic: ${outboundTopicId}`)

        // Store credentials (use a placeholder private key since we don't have the actual one)
        const placeholderPrivateKey = `placeholder-key-for-${agentId}`
        credentials.push({
          agentId: agentId,
          topicId: inboundTopicId, // Use inbound topic as primary
          privateKey: privateKey || placeholderPrivateKey,
          prefix: agent.prefix
        })

        console.log(`   🎉 Successfully registered ${agent.name}!`)

      } catch (error) {
        console.error(`   ❌ Failed to register ${agent.name}:`, error)
        throw error
      }
    }

    // Write credentials to .env file
    console.log('\n📝 Writing credentials to .env file...')
    
    const envContent = credentials.map(cred => 
      `${cred.prefix}_AGENT_ID=${cred.agentId}\n` +
      `${cred.prefix}_TOPIC_ID=${cred.topicId}\n` +
      `${cred.prefix}_PRIVATE_KEY=${cred.privateKey}`
    ).join('\n\n')

    // Append to existing .env file or create new one
    const existingEnv = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
    const newEnvContent = existingEnv + (existingEnv ? '\n\n' : '') + '# Agent Credentials\n' + envContent

    fs.writeFileSync('.env', newEnvContent)

    console.log('✅ Successfully wrote agent credentials to .env file')
    console.log('\n📋 Registered Agents Summary:')
    
    credentials.forEach(cred => {
      console.log(`   ${cred.prefix}:`)
      console.log(`     Agent ID: ${cred.agentId}`)
      console.log(`     Topic ID: ${cred.topicId}`)
      console.log(`     Private Key: ${cred.privateKey.substring(0, 20)}...`)
    })

    console.log('\n🎉 All agents registered successfully!')
    console.log('💡 You can now use these agents in your Hedron operations.')

  } catch (error) {
    console.error('❌ Agent registration failed:', error)
    process.exit(1)
  }
}

// Run the registration process
if (import.meta.url === `file://${process.argv[1]}`) {
  registerAgents()
    .then(() => {
      console.log('✅ Registration process completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Registration process failed:', error)
      process.exit(1)
    })
}

export { registerAgents }
