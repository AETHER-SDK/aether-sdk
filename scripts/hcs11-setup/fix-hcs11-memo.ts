import { Client, AccountUpdateTransaction, PrivateKey } from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

async function fixHCS11Memo(): Promise<void> {
  try {
    console.log(chalk.bold('🔧 Fixing HCS-11 Memo to Correct Format'))
    console.log('')

    const client = Client.forTestnet()
    const accountId = process.env.HEDERA_ACCOUNT_ID!
    const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
    
    client.setOperator(accountId, privateKey)
    
    // Set the correct memo format that the SDK expects
    // Format: hcs-11:hcs://1/{topic_id}
    const correctMemo = 'hcs-11:hcs://1/0.0.7133161'
    
    console.log(`Setting memo to: ${correctMemo}`)
    
    const tx = new AccountUpdateTransaction()
      .setAccountId(accountId)
      .setAccountMemo(correctMemo)
    
    const resp = await tx.execute(client)
    await resp.getReceipt(client)
    
    console.log(chalk.green('✅ Memo updated successfully!'))
    console.log(`   New memo: ${correctMemo}`)
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to update memo:'), error)
    process.exit(1)
  }
}

fixHCS11Memo()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); })

