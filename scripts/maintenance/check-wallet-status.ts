import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function showWalletStatus(): Promise<void> {
  try {
    console.log(chalk.bold('🔍 Wallet Status Analysis'))
    console.log('')

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
    
    // Settlement wallet
    const settlementWallet = new ethers.Wallet(process.env.SETTLEMENT_WALLET_PRIVATE_KEY!, provider)
    const settlementAddress = await settlementWallet.getAddress()
    
    // Merchant wallet
    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS!
    
    // USDC contract
    const usdcContract = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    const usdcAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']
    const usdcContractInstance = new ethers.Contract(usdcContract, usdcAbi, provider)
    
    console.log(chalk.bold('--- Wallet Balances ---'))
    
    // Check ETH balances
    const settlementEthBalance = await provider.getBalance(settlementAddress)
    const merchantEthBalance = await provider.getBalance(merchantAddress)
    
    console.log(chalk.blue('💰 ETH Balances:'))
    console.log(`Settlement Wallet: ${ethers.formatEther(settlementEthBalance)} ETH`)
    console.log(`Merchant Wallet: ${ethers.formatEther(merchantEthBalance)} ETH`)
    console.log('')
    
    // Check USDC balances
    const settlementUsdcBalance = await (usdcContractInstance as any).balanceOf(settlementAddress)
    const merchantUsdcBalance = await (usdcContractInstance as any).balanceOf(merchantAddress)
    const decimals = await (usdcContractInstance as any).decimals()
    
    console.log(chalk.blue('💵 USDC Balances:'))
    console.log(`Settlement Wallet: ${ethers.formatUnits(settlementUsdcBalance, decimals)} USDC`)
    console.log(`Merchant Wallet: ${ethers.formatUnits(merchantUsdcBalance, decimals)} USDC`)
    console.log('')
    
    console.log(chalk.bold('--- Wallet Addresses ---'))
    console.log(`Settlement Wallet: ${settlementAddress}`)
    console.log(`Merchant Wallet: ${merchantAddress}`)
    console.log('')
    
    console.log(chalk.bold('--- Analysis ---'))
    
    if (settlementEthBalance === 0n) {
      console.log(chalk.red('❌ Settlement wallet has no ETH for gas fees'))
      console.log(chalk.yellow('💡 Solution: Fund settlement wallet with ETH'))
      console.log('')
      console.log(chalk.green('🔗 Fund Settlement Wallet:'))
      console.log(`   https://sepolia.basescan.org/address/${settlementAddress}`)
      console.log('')
      console.log(chalk.green('🌐 Base Sepolia Faucets:'))
      console.log('   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet')
      console.log('   https://faucet.quicknode.com/base/sepolia')
      console.log('')
    } else {
      console.log(chalk.green('✅ Settlement wallet has ETH for gas fees'))
    }
    
    if (settlementUsdcBalance < ethers.parseUnits('10', decimals)) {
      console.log(chalk.red('❌ Settlement wallet has insufficient USDC for payment'))
      console.log(chalk.yellow('💡 Solution: Fund settlement wallet with USDC'))
    } else {
      console.log(chalk.green('✅ Settlement wallet has sufficient USDC for payment'))
    }
    
    console.log('')
    console.log(chalk.bold('--- Next Steps ---'))
    console.log('1. Fund settlement wallet with ETH for gas fees (~0.01 ETH)')
    console.log('2. Ensure settlement wallet has USDC for payment (10 USDC)')
    console.log('3. Run the payment test again')
    console.log('')
    console.log(chalk.green('🎯 Once funded, run: npm run test:funded'))

  } catch (error) {
    console.error(chalk.red('❌ Analysis failed:'), error)
  }
}

// Run the analysis
showWalletStatus()
  .then(() => {
    console.log(chalk.green('\n✅ Wallet analysis completed!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Analysis failed:'), error)
    process.exit(1)
  })
