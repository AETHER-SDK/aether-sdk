import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function executeDirectUSDCTransfer(): Promise<void> {
  try {
    console.log(chalk.bold('🚀 Executing Direct USDC Transfer'))
    console.log(chalk.gray('This will create a real blockchain transaction'))
    console.log('')

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    
    // Settlement wallet (sender)
    const settlementWallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, provider)
    const settlementAddress = await settlementWallet.getAddress()
    
    // Merchant wallet (receiver)
    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS!
    
    // USDC contract
    const usdcContract = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    const usdcAbi = [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ]
    
    const usdcContractInstance = new ethers.Contract(usdcContract, usdcAbi, settlementWallet)
    
    console.log(chalk.bold('--- Pre-Transfer Balances ---'))
    
    // Check balances before transfer
    const settlementBalanceBefore = await (usdcContractInstance as any).balanceOf(settlementAddress)
    const merchantBalanceBefore = await (usdcContractInstance as any).balanceOf(merchantAddress)
    const decimals = await (usdcContractInstance as any).decimals()
    
    console.log(`Settlement Wallet: ${ethers.formatUnits(settlementBalanceBefore, decimals)} USDC`)
    console.log(`Merchant Wallet: ${ethers.formatUnits(merchantBalanceBefore, decimals)} USDC`)
    console.log('')

    // Transfer 1 USDC (to avoid transferring all 10)
    const transferAmount = ethers.parseUnits('1', decimals)
    
    console.log(chalk.bold('--- Executing Transfer ---'))
    console.log(chalk.yellow(`📤 Transferring 1 USDC from ${settlementAddress} to ${merchantAddress}`))
    
    // Execute the transfer
    const tx = await (usdcContractInstance as any).transfer(merchantAddress, transferAmount)
    
    console.log(chalk.blue('📋 Transaction Hash:'), tx.hash)
    console.log(chalk.yellow('⏳ Waiting for confirmation...'))
    
    // Wait for confirmation
    const receipt = await tx.wait()
    
    console.log(chalk.green('✅ Transfer confirmed!'))
    console.log(chalk.blue('📋 Block Number:'), receipt.blockNumber)
    console.log(chalk.blue('⛽ Gas Used:'), receipt.gasUsed.toString())
    console.log('')

    console.log(chalk.bold('--- Post-Transfer Balances ---'))
    
    // Check balances after transfer
    const settlementBalanceAfter = await (usdcContractInstance as any).balanceOf(settlementAddress)
    const merchantBalanceAfter = await (usdcContractInstance as any).balanceOf(merchantAddress)
    
    console.log(`Settlement Wallet: ${ethers.formatUnits(settlementBalanceAfter, decimals)} USDC`)
    console.log(`Merchant Wallet: ${ethers.formatUnits(merchantBalanceAfter, decimals)} USDC`)
    console.log('')

    console.log(chalk.bold('--- Transaction Details ---'))
    console.log(chalk.green('✅ Real blockchain transaction executed!'))
    console.log(chalk.blue('🌐 BaseScan Transaction:'))
    console.log(`   https://sepolia.basescan.org/tx/${tx.hash}`)
    console.log(chalk.blue('🔍 Settlement Wallet:'))
    console.log(`   https://sepolia.basescan.org/address/${settlementAddress}`)
    console.log(chalk.blue('🔍 Merchant Wallet:'))
    console.log(`   https://sepolia.basescan.org/address/${merchantAddress}`)

  } catch (error) {
    console.error(chalk.red('❌ Transfer failed:'), error)
    throw error
  }
}

// Run the transfer
executeDirectUSDCTransfer()
  .then(() => {
    console.log(chalk.green('\n🎉 USDC transfer completed successfully!'))
    console.log(chalk.yellow('💡 Check BaseScan for the actual transaction'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Transfer failed:'), error)
    process.exit(1)
  })
