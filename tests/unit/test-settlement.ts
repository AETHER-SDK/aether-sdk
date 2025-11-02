import { SettlementAgent } from '../../src/agents/SettlementAgent'
import chalk from 'chalk'

async function testSettlementAgent() {
  try {
    console.log(chalk.blue('🚀 Testing SettlementAgent...'))
    
    // Create SettlementAgent instance
    const settlementAgent = new SettlementAgent()
    
    // Initialize the agent
    await settlementAgent.init()
    
    console.log(chalk.green('✅ SettlementAgent initialized successfully'))
    
    // Test completed, exit after short delay
    setTimeout(() => {
      console.log(chalk.green('✅ SettlementAgent test passed'))
      process.exit(0)
    }, 2000)
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to test SettlementAgent:'), error)
    process.exit(1)
  }
}

// Run the test
testSettlementAgent()
