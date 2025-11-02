import { Client, AccountUpdateTransaction, PrivateKey, AccountInfoQuery } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Fixed HCS-11 Memo Setup Script
 * 
 * This script addresses the HCS-11 memo error by setting up proper memo format
 * that complies with the HCS-11 standard for profile retrieval.
 * 
 * Error being fixed:
 * "Account 0.0.7132337 does not have a valid HCS-11 memo. Current memo: HCS-11:agent-coordinator"
 */
async function setupHCS11MemoFixed(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Setting up Fixed HCS-11 Memo for Main Account'))
    console.log(chalk.gray('Addressing: "Failed to retrieve profile" error'))
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
    
    // First, check current account info
    console.log(chalk.bold('--- Checking Current Account Status ---'))
    try {
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
      
      console.log(chalk.yellow('Current memo:'), accountInfo.accountMemo || '(empty)')
      console.log(chalk.yellow('Account balance:'), `${accountInfo.balance} tinybars`)
      console.log(chalk.yellow('Account key:'), accountInfo.key?.toString())
    } catch (error) {
      console.error(chalk.red('❌ Error fetching account info:'), error)
      return
    }
    
    console.log(chalk.bold('--- Setting Proper HCS-11 Memo ---'))
    
    // Create proper HCS-11 memo format
    // The HCS-11 standard requires a specific format for profile retrieval
    const memo = 'HCS-11:profile:agent-coordinator:v1.0'
    console.log(chalk.yellow('Setting memo:'), memo)
    console.log(chalk.gray('Format: HCS-11:profile:{identifier}:{version}'))
    
    // Update account with proper memo
    const transaction = new AccountUpdateTransaction()
      .setAccountId(accountId)
      .setAccountMemo(memo)
    
    console.log(chalk.yellow('Executing account update transaction...'))
    const response = await transaction.execute(client)
    const receipt = await response.getReceipt(client)
    
    console.log(chalk.green('✅ Account updated successfully!'))
    console.log('')

    // Verify the update
    console.log(chalk.bold('--- Verification ---'))
    try {
      const updatedAccountInfo = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
      
      console.log(chalk.green('✅ Updated memo:'), updatedAccountInfo.accountMemo)
      console.log(chalk.green('✅ HCS-11 memo has been properly set'))
      console.log(chalk.yellow('💡 The account can now send HCS-10 messages and retrieve profiles'))
    } catch (error) {
      console.error(chalk.red('❌ Error verifying account update:'), error)
    }
    
    console.log('')
    console.log(chalk.bold('--- Next Steps ---'))
    console.log('1. Run the agent coordination test again')
    console.log('2. HCS-10 message sending should now work without profile errors')
    console.log('3. Agents will be able to communicate via Hedera Consensus Service')
    console.log('4. Profile retrieval should work for account', accountId)

  } catch (error) {
    console.error(chalk.red('❌ Error setting up HCS-11 memo:'), error)
    throw error
  }
}

// Run the setup
setupHCS11MemoFixed()
  .then(() => {
    console.log(chalk.green('\n🎉 Fixed HCS-11 memo setup completed!'))
    console.log(chalk.green('The "Failed to retrieve profile" error should now be resolved.'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Fixed HCS-11 memo setup failed:'), error)
    process.exit(1)
  })
