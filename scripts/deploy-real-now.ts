import chalk from 'chalk'
import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  ContractCreateTransaction,
  Hbar
} from '@hashgraph/sdk'

dotenv.config()

async function deployNow() {
  console.log(chalk.bold.cyan('🚀 Deploying Real Contract to Hedera...\n'))
  
  const client = Client.forTestnet()
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
  )
  
  try {
    // Load bytecode from compiled contract
    const artifactPath = path.join(__dirname, '../artifacts/contracts/SimpleSupplyChain.sol/SimpleSupplyChain.json')
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'))
    const bytecode = artifact.bytecode.replace('0x', '')
    
    console.log(chalk.green('✅ Loaded compiled bytecode\n'))
    
    // Upload to Hedera
    console.log(chalk.blue('📤 Uploading to Hedera...'))
    const fileTx = await new FileCreateTransaction()
      .setContents(Buffer.from(bytecode, 'hex'))
      .execute(client)
    
    const fileId = (await fileTx.getReceipt(client)).fileId!
    console.log(chalk.green(`✅ File ID: ${fileId}\n`))
    
    // Deploy contract
    console.log(chalk.blue('📝 Deploying contract...'))
    const deployTx = await new ContractCreateTransaction()
      .setBytecodeFileId(fileId)
      .setGas(1_000_000)
      .setConstructorParameters()
      .setInitialBalance(Hbar.fromTinybars(100_000_000))
      .execute(client)
    
    const receipt = await deployTx.getReceipt(client)
    const contractId = receipt.contractId!
    
    console.log(chalk.bold.green('\n✅ DEPLOYED SUCCESSFULLY!\n'))
    console.log(chalk.cyan(`   Contract ID: ${contractId}`))
    console.log(chalk.cyan(`   HashScan: https://hashscan.io/testnet/contract/${contractId}\n`))
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed: ${(error as Error).message}\n`))
  } finally {
    await client.close()
  }
}

deployNow()
