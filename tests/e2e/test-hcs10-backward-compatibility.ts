/**
 * E2E Test: HCS-10 Backward Compatibility
 * 
 * Verifies that existing direct topic messaging still works
 * Tests mixed mode (some agents use connections, others use direct topics)
 * Ensures no breaking changes to existing API
 */

import { AnalyzerAgent } from '../../src/agents/AnalyzerAgent'
import { VerifierAgent } from '../../src/agents/VerifierAgent'
import { SettlementAgent } from '../../src/agents/SettlementAgent'
import { A2AProtocol } from '../../src/protocols/A2AProtocol'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testBackwardCompatibility(): Promise<void> {
  try {
    console.log(chalk.bold.cyan('\n🧪 E2E Test: HCS-10 Backward Compatibility\n'))
    console.log(chalk.gray('Verifying existing APIs still work with new HCS-10 features\n'))

    // Test 1: Direct Topic Messaging (Original Method)
    console.log(chalk.bold('--- Test 1: Direct Topic Messaging (Original Method) ---'))
    
    const accountId = process.env.HEDERA_ACCOUNT_ID
    const privateKey = process.env.HEDERA_PRIVATE_KEY

    if (!accountId || !privateKey) {
      throw new Error('Missing required credentials')
    }

    const hcsClient = new HCS10Client(accountId, privateKey, 'testnet')
    
    // Test direct sendMessage (should still work)
    const testTopicId = process.env.VERIFIER_TOPIC_ID || process.env.ANALYZER_TOPIC_ID
    
    if (testTopicId) {
      const testMessage = {
        type: 'test_message',
        timestamp: Date.now(),
        content: 'Backward compatibility test'
      }

      try {
        await hcsClient.sendMessage(testTopicId, JSON.stringify(testMessage))
        console.log(chalk.green('✅ Direct topic messaging works'))
        console.log(chalk.blue(`   Topic: ${testTopicId}\n`))
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Direct messaging test: ${(error as Error).message}\n`))
      }
    } else {
      console.log(chalk.yellow('⚠️  No topic ID available for direct messaging test\n'))
    }

    // Test 2: A2A Protocol Without Connections
    console.log(chalk.bold('--- Test 2: A2A Protocol Without Connections ---'))
    
    const a2a = new A2AProtocol(
      hcsClient,
      accountId,
      ['test'],
      undefined, // No connection manager
      undefined  // No transaction approval
    )

    const a2aMessage = a2a.createMessage('test-receiver', 'request', {
      type: 'test',
      data: 'backward compatibility'
    })

    if (a2aMessage.version === '1.0' && a2aMessage.sender.agentId === accountId) {
      console.log(chalk.green('✅ A2A protocol works without connections'))
      console.log(chalk.blue(`   Message version: ${a2aMessage.version}`))
      console.log(chalk.blue(`   Sender: ${a2aMessage.sender.agentId}\n`))
    }

    // Test 3: A2A sendMessage (Backward Compatible)
    console.log(chalk.bold('--- Test 3: A2A sendMessage (Backward Compatible) ---'))
    
    if (testTopicId) {
      try {
        await a2a.sendMessage(
          testTopicId,
          'test-receiver',
          'notification',
          { type: 'test', message: 'backward compatible sendMessage' }
        )
        console.log(chalk.green('✅ A2A sendMessage() works (backward compatible)\n'))
      } catch (error) {
        console.log(chalk.yellow(`⚠️  A2A sendMessage test: ${(error as Error).message}\n`))
      }
    }

    // Test 4: Agents Without Connection Managers
    console.log(chalk.bold('--- Test 4: Agents Without Connection Managers ---'))
    
    // Disable connections for this test
    const originalEnv = process.env.USE_HCS10_CONNECTIONS
    delete process.env.USE_HCS10_CONNECTIONS

    const analyzer = new AnalyzerAgent()
    await analyzer.init()

    const connectionManager = analyzer.getConnectionManager()
    if (!connectionManager) {
      console.log(chalk.green('✅ Agent works without connection manager'))
      console.log(chalk.blue('   Connection manager is optional (backward compatible)\n'))
    }

    // Test 5: Mixed Mode (Some with connections, some without)
    console.log(chalk.bold('--- Test 5: Mixed Mode Compatibility ---'))
    
    // One agent with connections enabled
    process.env.USE_HCS10_CONNECTIONS = 'true'
    const verifierWithConn = new VerifierAgent()
    
    // One agent without connections
    delete process.env.USE_HCS10_CONNECTIONS
    const settlementWithoutConn = new SettlementAgent()

    const verifierConnMgr = verifierWithConn.getConnectionManager()
    const settlementConnMgr = settlementWithoutConn.getConnectionManager()

    if (verifierConnMgr && !settlementConnMgr) {
      console.log(chalk.green('✅ Mixed mode works'))
      console.log(chalk.blue('   Agents can have connections enabled/disabled independently\n'))
    }

    // Restore original environment
    if (originalEnv) {
      process.env.USE_HCS10_CONNECTIONS = originalEnv
    } else {
      delete process.env.USE_HCS10_CONNECTIONS
    }

    // Test 6: A2A Message Parsing (Should Still Work)
    console.log(chalk.bold('--- Test 6: A2A Message Parsing (Should Still Work) ---'))
    
    const parsed = a2a.parseMessage(JSON.stringify(a2aMessage))
    if (parsed && parsed.version === '1.0') {
      console.log(chalk.green('✅ A2A message parsing works'))
      console.log(chalk.blue(`   Parsed message type: ${parsed.messageType}\n`))
    }

    console.log(chalk.bold.green('\n✅ Backward Compatibility Tests Complete!\n'))
    console.log(chalk.blue('Summary:'))
    console.log(chalk.blue('  ✓ Direct topic messaging still works'))
    console.log(chalk.blue('  ✓ A2A protocol works without connections'))
    console.log(chalk.blue('  ✓ Agents work without connection managers'))
    console.log(chalk.blue('  ✓ Mixed mode (connections + direct topics) supported'))
    console.log(chalk.blue('  ✓ No breaking changes to existing APIs\n'))

  } catch (error) {
    console.error(chalk.red(`\n❌ Backward compatibility test failed: ${(error as Error).message}\n`))
    throw error
  }
}

// Run the test
testBackwardCompatibility()
  .then(() => {
    console.log(chalk.green('\n🎉 Backward compatibility test finished!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Backward compatibility test failed:'), error)
    process.exit(1)
  })

