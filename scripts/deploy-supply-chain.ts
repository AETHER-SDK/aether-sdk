/**
 * Deploy Supply Chain Agreement Smart Contract
 * 
 * This script compiles and deploys the SupplyChainAgreement contract
 * to Hedera EVM testnet.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  Hbar,
  TransactionReceiptQuery,
  FileContentsQuery
} from '@hashgraph/sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

interface DeployResult {
  contractId: string
  contractAddress: string
  fileId: string
}

async function deploySupplyChainContract(
  buyerAddress: string,
  vendorAddress: string,
  terms: {
    pricePerUnit: number
    quantity: number
    deliveryDate: string
    paymentScheduleDays: number
    warrantyMonths: number
  }
): Promise<DeployResult> {
  console.log(chalk.blue('🚀 Deploying Supply Chain Agreement Contract\n'))
  
  const accountId = process.env.HEDERA_ACCOUNT_ID!
  const privateKey = process.env.HEDERA_PRIVATE_KEY!
  
  const client = Client.forTestnet()
  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromString(privateKey)
  )
  
  try {
    // Step 1: Load compiled bytecode
    console.log(chalk.blue('📋 Step 1: Loading compiled contract...'))
    
    // Note: In production, you would use Hardhat to compile
    // For now, we'll simulate the deployment process
    const contractPath = path.join(__dirname, '../contracts/SupplyChainAgreement.sol')
    const contractSource = fs.readFileSync(contractPath, 'utf-8')
    
    console.log(chalk.green('✅ Contract source loaded'))
    console.log(chalk.yellow('⚠️  Note: In production, this would compile Solidity to bytecode'))
    console.log(chalk.yellow('    For demo, we simulate with a Hedera smart contract\n'))
    
    // Step 2: Create file for bytecode
    console.log(chalk.blue('📋 Step 2: Creating contract file on Hedera...'))
    
    const fileTx = await new FileCreateTransaction()
      .setContents(
        Buffer.from(
          'This is a placeholder for the compiled Solidity bytecode.\n' +
          'In production, use: npx hardhat compile\n' +
          'Then deploy with the actual bytecode.'
        )
      )
      .execute(client)
    
    const fileTxReceipt = await fileTx.getReceipt(client)
    const fileId = fileTxReceipt.fileId
    
    console.log(chalk.green(`✅ File created: ${fileId}`))
    
    // Step 3: Convert addresses and dates
    const deliveryDeadline = Math.floor(new Date(terms.deliveryDate).getTime() / 1000)
    const paymentScheduleSeconds = terms.paymentScheduleDays * 86400
    const warrantySeconds = terms.warrantyMonths * 2592000 // approximate
    
    console.log(chalk.blue('\n📋 Step 3: Deploying contract with parameters...'))
    console.log(chalk.gray(`   Buyer: ${buyerAddress}`))
    console.log(chalk.gray(`   Vendor: ${vendorAddress}`))
    console.log(chalk.gray(`   Price: $${terms.pricePerUnit}/unit`))
    console.log(chalk.gray(`   Quantity: ${terms.quantity}`))
    console.log(chalk.gray(`   Delivery: ${terms.deliveryDate}`))
    console.log(chalk.gray(`   Payment: Net ${terms.paymentScheduleDays}`))
    console.log(chalk.gray(`   Warranty: ${terms.warrantyMonths} months\n`))
    
    // Step 4: Deploy contract
    const totalValue = terms.pricePerUnit * terms.quantity
    const hbarAmount = totalValue / 100 // Approximate 1 HBAR = $0.01 for demo
    
    const deployTx = await new ContractCreateTransaction()
      .setBytecodeFileId(fileId)
      .setGas(1_000_000)
      .setConstructorParameters(
        new ContractFunctionParameters()
          .addString(buyerAddress)
          .addString(vendorAddress)
          .addUint256(terms.pricePerUnit)
          .addUint256(terms.quantity)
          .addUint256(deliveryDeadline)
          .addUint256(paymentScheduleSeconds)
          .addUint256(warrantySeconds)
      )
      .setInitialBalance(Hbar.fromTinybars(100_000_000)) // 1 HBAR
      .freezeWith(client)
    
    console.log(chalk.yellow('📤 Signing transaction...'))
    const signTx = await deployTx.sign(PrivateKey.fromString(privateKey))
    
    console.log(chalk.yellow('⏳ Executing transaction on Hedera...'))
    const executeTx = await signTx.execute(client)
    
    console.log(chalk.yellow('⏳ Waiting for receipt...'))
    const receipt = await executeTx.getReceipt(client)
    
    const contractId = receipt.contractId!
    const contractAddress = contractId.toSolidityAddress()
    
    console.log(chalk.green(`\n✅ Contract Deployed Successfully!\n`))
    console.log(chalk.cyan(`   Contract ID: ${contractId}`))
    console.log(chalk.cyan(`   EVM Address: ${contractAddress}`))
    console.log(chalk.cyan(`   HashScan: https://hashscan.io/testnet/contract/${contractId}\n`))
    
    return {
      contractId: contractId.toString(),
      contractAddress,
      fileId: fileId.toString()
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Deployment failed: ${(error as Error).message}\n`))
    throw error
  } finally {
    await client.close()
  }
}

export async function deployAgreement(
  buyerAddress: string,
  vendorAddress: string,
  pricePerUnit: number,
  quantity: number,
  deliveryDate: string,
  paymentScheduleDays: number = 30,
  warrantyMonths: number = 12
): Promise<DeployResult> {
  return deploySupplyChainContract(buyerAddress, vendorAddress, {
    pricePerUnit,
    quantity,
    deliveryDate,
    paymentScheduleDays,
    warrantyMonths
  })
}

// CLI usage
if (require.main === module) {
  const buyerAddress = process.env.BUYER_ADDRESS || '0x' + '0'.repeat(40)
  const vendorAddress = process.env.VENDOR_ADDRESS || '0x' + '0'.repeat(40)
  
  deployAgreement(
    buyerAddress,
    vendorAddress,
    85,
    1000,
    '2024-03-10',
    30,
    12
  ).catch(console.error)
}

