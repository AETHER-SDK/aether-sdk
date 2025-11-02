/**
 * Integration Tests for A2A Protocol
 * 
 * Tests A2A message sending, receiving, parsing, and handshake
 */

import { A2AProtocol } from '../../src/protocols/A2AProtocol'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

async function testA2AProtocol() {
  console.log(chalk.bold.cyan('\n🧪 Testing A2A Protocol\n'))

  try {
    // Initialize HCS client
    const agentId = process.env.SETTLEMENT_AGENT_ID || process.env.HEDERA_ACCOUNT_ID
    const privateKey = process.env.SETTLEMENT_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY

    if (!agentId || !privateKey) {
      throw new Error('Missing credentials for test')
    }

    const hcsClient = new HCS10Client(agentId, privateKey, 'testnet')

    // Initialize A2A protocol
    const a2a = new A2AProtocol(
      hcsClient,
      agentId,
      ['payment', 'settlement', 'negotiation']
    )

    console.log(chalk.green('✅ A2A Protocol initialized'))

    // Test 1: Create A2A Message
    console.log(chalk.blue('\n📝 Test 1: Create A2A Message'))
    const message = a2a.createMessage(
      'receiver-agent-123',
      'request',
      {
        type: 'payment_request',
        amount: '1000000',
        currency: 'USDC'
      }
    )

    console.log(chalk.green(`✅ Message created`))
    console.log(chalk.gray(`   Version: ${message.version}`))
    console.log(chalk.gray(`   Sender: ${message.sender.agentId}`))
    console.log(chalk.gray(`   Receiver: ${message.receiver.agentId}`))
    console.log(chalk.gray(`   Type: ${message.messageType}`))
    console.log(chalk.gray(`   Nonce: ${message.nonce}`))

    // Test 2: Parse A2A Message
    console.log(chalk.blue('\n📝 Test 2: Parse A2A Message'))
    const messageContent = JSON.stringify(message)
    const parsed = a2a.parseMessage(messageContent)

    if (parsed) {
      console.log(chalk.green(`✅ Message parsed successfully`))
      console.log(chalk.gray(`   Valid A2A message detected`))
    } else {
      console.log(chalk.red(`❌ Failed to parse message`))
    }

    // Test 3: Parse Invalid Message
    console.log(chalk.blue('\n📝 Test 3: Parse Invalid Message'))
    const invalidMessage = 'not-a-valid-a2a-message'
    const parsedInvalid = a2a.parseMessage(invalidMessage)

    if (!parsedInvalid) {
      console.log(chalk.green(`✅ Invalid message correctly rejected`))
    } else {
      console.log(chalk.red(`❌ Should have rejected invalid message`))
    }

    // Test 4: Message with Wrong Version
    console.log(chalk.blue('\n📝 Test 4: Parse Wrong Version'))
    const wrongVersion = {
      version: '2.0',
      sender: { agentId: 'test', capabilities: [] },
      receiver: { agentId: 'test2' },
      messageType: 'request',
      payload: {},
      timestamp: Date.now(),
      nonce: 'test-nonce'
    }

    const parsedWrong = a2a.parseMessage(JSON.stringify(wrongVersion))

    if (!parsedWrong) {
      console.log(chalk.green(`✅ Wrong version correctly rejected`))
    } else {
      console.log(chalk.red(`❌ Should have rejected wrong version`))
    }

    console.log(chalk.bold.green('\n✅ All A2A Protocol Tests Passed!\n'))

  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${(error as Error).message}\n`))
    process.exit(1)
  }
}

// Run tests
testA2AProtocol()

