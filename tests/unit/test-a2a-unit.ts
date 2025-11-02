/**
 * Unit Tests for A2A Protocol (No credentials required)
 * 
 * Tests A2A message creation, parsing, and validation without HCS client
 */

import { A2AProtocol } from '../../src/protocols/A2AProtocol'
import chalk from 'chalk'

// Mock HCS10Client for unit testing
class MockHCSClient {
  async sendMessage(topicId: string, message: string): Promise<void> {
    // Mock implementation
  }
  async getMessages(topicId: string): Promise<any> {
    return { messages: [] }
  }
}

async function testA2AProtocol() {
  console.log(chalk.bold.cyan('\n🧪 Unit Testing A2A Protocol (No credentials required)\n'))

  try {
    // Use mock HCS client
    const mockHcsClient = new MockHCSClient() as any
    const agentId = 'test-agent-123'
    const capabilities = ['payment', 'settlement', 'negotiation']

    // Initialize A2A protocol
    const a2a = new A2AProtocol(mockHcsClient, agentId, capabilities)

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

    // Verify message structure
    if (message.version !== '1.0') throw new Error('Wrong version')
    if (message.sender.agentId !== agentId) throw new Error('Wrong sender')
    if (message.receiver.agentId !== 'receiver-agent-123') throw new Error('Wrong receiver')
    if (message.messageType !== 'request') throw new Error('Wrong messageType')

    // Test 2: Parse A2A Message
    console.log(chalk.blue('\n📝 Test 2: Parse A2A Message'))
    const messageContent = JSON.stringify(message)
    const parsed = a2a.parseMessage(messageContent)

    if (parsed) {
      console.log(chalk.green(`✅ Message parsed successfully`))
      console.log(chalk.gray(`   Valid A2A message detected`))
    } else {
      throw new Error('Failed to parse valid message')
    }

    // Test 3: Parse Invalid Message
    console.log(chalk.blue('\n📝 Test 3: Parse Invalid Message'))
    const invalidMessage = 'not-a-valid-a2a-message'
    const parsedInvalid = a2a.parseMessage(invalidMessage)

    if (!parsedInvalid) {
      console.log(chalk.green(`✅ Invalid message correctly rejected`))
    } else {
      throw new Error('Should have rejected invalid message')
    }

    // Test 4: Message with Wrong Version
    console.log(chalk.blue('\n📝 Test 4: Parse Wrong Version'))
    const wrongVersion = {
      version: '2.0',
      sender: { agentId: 'test', capabilities: [], network: 'hedera-testnet' },
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
      throw new Error('Should have rejected wrong version')
    }

    // Test 5: Create Different Message Types
    console.log(chalk.blue('\n📝 Test 5: Create Different Message Types'))
    
    const responseMessage = a2a.createMessage('test-agent', 'response', { status: 'success' })
    if (responseMessage.messageType !== 'response') throw new Error('Wrong response type')
    
    const notificationMessage = a2a.createMessage('test-agent', 'notification', { event: 'complete' })
    if (notificationMessage.messageType !== 'notification') throw new Error('Wrong notification type')
    
    console.log(chalk.green(`✅ All message types working`))

    console.log(chalk.bold.green('\n✅ All A2A Protocol Unit Tests Passed!\n'))

  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${(error as Error).message}\n`))
    process.exit(1)
  }
}

// Run tests
testA2AProtocol()

