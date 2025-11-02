import { Client, AccountUpdateTransaction, PrivateKey } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function setupHCS11Memo(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Setting up HCS-11 Memo for Main Account'))
    console.log('')

    // Initialize Hedera client
    const client = Client.forTestnet()
    
    // Parse account ID and private key
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
    client.setOperator(accountId, privateKey)
    
    console.log(chalk.bold('--- Setting HCS-11 Memo ---'))
    
    // Create HCS-11 memo
    const memo = 'HCS-11:agent-coordinator'
    console.log(chalk.yellow('Setting memo:'), memo)
    
    // Update account with memo
    const transaction = new AccountUpdateTransaction()
      .setAccountId(accountId)
      .setAccountMemo(memo)
    
    console.log(chalk.yellow('Executing account update transaction...'))
    const response = await transaction.execute(client)
    const receipt = await response.getReceipt(client)
    
    console.log(chalk.green('✅ Account updated successfully!'))
    console.log('')

    console.log(chalk.bold('--- Verification ---'))
    console.log(chalk.green('✅ HCS-11 memo has been set on the main account'))
    console.log(chalk.yellow('💡 The account can now send HCS-10 messages'))
    console.log('')
    console.log(chalk.bold('--- Next Steps ---'))
    console.log('1. Run the agent coordination test again')
    console.log('2. HCS-10 message sending should now work')
    console.log('3. Agents will communicate via Hedera Consensus Service')

  } catch (error) {
    console.error(chalk.red('❌ Error setting up HCS-11 memo:'), error)
    throw error
  }
}

// Run the setup
setupHCS11Memo()
  .then(() => {
    console.log(chalk.green('\n🎉 HCS-11 memo setup completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 HCS-11 memo setup failed:'), error)
    process.exit(1)
  })
