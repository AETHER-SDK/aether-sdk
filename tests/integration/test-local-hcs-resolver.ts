import { LocalHCSProfileResolver } from '../../src/facilitator/LocalHCSProfileResolver'
import chalk from 'chalk'

async function testLocalHCSResolver(): Promise<void> {
  try {
    console.log(chalk.bold('🧪 Testing Local HCS Profile Resolver'))
    console.log('')

    // Initialize resolver
    const resolver = new LocalHCSProfileResolver(3001)
    resolver.init()

    // Start server
    await resolver.start()
    console.log('')

    // Test health endpoint
    console.log(chalk.bold('--- Testing Health Endpoint ---'))
    const healthResponse = await fetch('http://localhost:3001/health')
    const healthData = await healthResponse.json()
    console.log(chalk.blue('📋 Health Response:'))
    console.log(JSON.stringify(healthData, null, 2))
    console.log('')

    // Test profile endpoint
    console.log(chalk.bold('--- Testing Profile Endpoint ---'))
    const accountId = process.env.HEDERA_ACCOUNT_ID || '0.0.7132337'
    
    try {
      const profileResponse = await fetch(`http://localhost:3001/hcs-11/profile/${accountId}`)
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        console.log(chalk.green('✅ Profile retrieved:'))
        console.log(JSON.stringify(profile, null, 2))
      } else {
        const error = await profileResponse.json()
        console.log(chalk.yellow('⚠️  Profile not found:'))
        console.log(JSON.stringify(error, null, 2))
      }
    } catch (error) {
      console.log(chalk.red('❌ Error fetching profile:'), error)
    }
    console.log('')

    // Test topic endpoint
    console.log(chalk.bold('--- Testing Topic Endpoint ---'))
    try {
      const topicResponse = await fetch('http://localhost:3001/profile/0.0.7133161')
      const topicData = await topicResponse.json()
      console.log(chalk.blue('📋 Topic Messages:'))
      console.log(`   Count: ${topicData.count}`)
      if (topicData.messages && topicData.messages.length > 0) {
        console.log(chalk.green('✅ Found messages in topic'))
        console.log(chalk.gray('   First message:'))
        try {
          const firstMsg = JSON.parse(topicData.messages[0])
          console.log(JSON.stringify(firstMsg, null, 2))
        } catch (e) {
          console.log(topicData.messages[0].substring(0, 100) + '...')
        }
      }
    } catch (error) {
      console.log(chalk.red('❌ Error fetching topic:'), error)
    }
    console.log('')

    // Stop server
    console.log(chalk.bold('--- Stopping Server ---'))
    await resolver.stop()
    
    console.log('')
    console.log(chalk.green('✅ Local HCS Resolver test completed!'))
    console.log(chalk.blue('💡 Local resolver can serve HCS-11 profiles without external CDN'))

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error)
    throw error
  }
}

// Run the test
testLocalHCSResolver()
  .then(() => {
    console.log(chalk.green('\n🎉 Test completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Test failed:'), error)
    process.exit(1)
  })

