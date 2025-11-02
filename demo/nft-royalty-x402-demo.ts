/**
 * NFT Royalty Settlement with x402 Payment Standard (Cross-Chain)
 * 
 * Bounty 1: Hedera x402 Payment Standard SDK
 * 
 * Demonstrates x402 payment protocol for NFT royalty settlements:
 * - NFT sale on Hedera or any network
 * - Automatic royalty calculation (10%)
 * - Cross-chain x402 payment to creator
 * - USDC settlement on Base Sepolia
 * - Payment verification via facilitator
 * 
 * Technology:
 * - x402 payment standard
 * - Cross-chain settlements
 * - USDC on Base Sepolia
 * - Automated royalty distribution
 */

import { SettlementAgent } from '../src/agents/SettlementAgent'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

interface NFTSale {
  nftId: string
  tokenName: string
  salePrice: number // USD
  buyerAddress: string
  network: string
}

interface NFTRoyalty extends NFTSale {
  royaltyPercentage: number
  royaltyAmount: number
  creatorAddress: string
  creatorAccountId?: string | undefined
  settlementNetwork: string
  settlementAsset: string
}

/**
 * NFT Royalty Settlement Demo
 * Showcases x402 cross-chain payment for NFT royalties
 */
async function nftRoyaltySettlementDemo(): Promise<void> {
  try {
    // Demo header
    console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🎨 NFT ROYALTY SETTLEMENT WITH x402 (CROSS-CHAIN)            ║
║     Bounty 1: Hedera x402 Payment Standard SDK               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`))

    console.log(chalk.bold('\n📖 Use Case: Automated NFT Royalty Payments\n'))
    console.log(chalk.blue('🎨 Scenario:'))
    console.log(chalk.gray('   • NFT sold on marketplace'))
    console.log(chalk.gray('   • Automatic 10% royalty calculation'))
    console.log(chalk.gray('   • Creator prefers USDC on Base Sepolia'))
    console.log(chalk.gray('   • x402 handles cross-chain settlement'))
    console.log('')

    // Configuration
    const salePrice = parseFloat(process.argv[2] || '150') // USD
    const royaltyPercentage = 10 // 10% standard royalty rate
    
    // Create NFT sale scenario
    const sale: NFTSale = {
      nftId: `HederaArt #${Math.floor(Math.random() * 10000)}`,
      tokenName: 'Digital Art Collection',
      salePrice,
      buyerAddress: '0x' + Math.random().toString(16).substring(2, 42),
      network: 'hedera-testnet'
    }

    // Calculate royalty
    const royalty: NFTRoyalty = {
      nftId: sale.nftId,
      tokenName: sale.tokenName,
      salePrice: sale.salePrice,
      buyerAddress: sale.buyerAddress,
      network: sale.network,
      royaltyPercentage,
      royaltyAmount: salePrice * (royaltyPercentage / 100),
      creatorAddress: process.env.MERCHANT_WALLET_ADDRESS || '0xb36faaA498D6E40Ee030fF651330aefD1b8D24D2',
      creatorAccountId: process.env.HEDERA_MERCHANT_ACCOUNT_ID,
      settlementNetwork: 'base-sepolia',
      settlementAsset: 'USDC'
    }

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 1: NFT Sale Detection
    console.log(chalk.bold.yellow('📊 Phase 1: NFT Sale Detected\n'))
    
    console.log(chalk.blue('🎨 NFT Sale Details:'))
    console.log(`   NFT: ${royalty.nftId}`)
    console.log(`   Collection: ${royalty.tokenName}`)
    console.log(`   Sale Price: $${royalty.salePrice.toFixed(2)} USD`)
    console.log(`   Buyer: ${royalty.buyerAddress.substring(0, 10)}...`)
    console.log(`   Network: ${royalty.network}`)
    console.log('')

    console.log(chalk.blue('💰 Royalty Calculation:'))
    console.log(`   Rate: ${royalty.royaltyPercentage}%`)
    console.log(`   Amount: $${royalty.royaltyAmount.toFixed(2)} USD`)
    console.log(`   Creator: ${royalty.creatorAddress}`)
    console.log('')

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 2: Initialize Settlement Agent
    console.log(chalk.bold.yellow('🔧 Phase 2: Initializing x402 Settlement\n'))
    
    console.log(chalk.blue('📋 x402 Payment Configuration:'))
    console.log(`   Protocol: x402 (Payment Standard)`)
    console.log(`   Settlement Network: ${royalty.settlementNetwork}`)
    console.log(`   Settlement Asset: ${royalty.settlementAsset}`)
    console.log(`   Payment Type: Cross-chain NFT royalty`)
    console.log('')

    const settlement = new SettlementAgent()
    console.log(chalk.yellow('⏳ Initializing SettlementAgent...'))
    await settlement.init()
    console.log(chalk.green('✅ SettlementAgent ready for x402 payments'))
    console.log('')

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Phase 3: Execute Cross-Chain Payment
    console.log(chalk.bold.yellow('💰 Phase 3: Executing Cross-Chain x402 Payment\n'))
    
    console.log(chalk.blue('📋 Payment Details:'))
    console.log(`   Network: Base Sepolia (EVM)`)
    console.log(`   Asset: ${royalty.settlementAsset}`)
    console.log(`   Amount: $${royalty.royaltyAmount.toFixed(2)}`)
    console.log(`   Recipient: ${royalty.creatorAddress}`)
    console.log(`   Purpose: NFT Royalty for ${royalty.nftId}`)
    console.log('')

    console.log(chalk.yellow('⏳ Executing x402 payment flow...'))
    console.log(chalk.gray('   1. Creating payment authorization'))
    console.log(chalk.gray('   2. Verifying payment via facilitator'))
    console.log(chalk.gray(`   3. Settling USDC on ${royalty.settlementNetwork}`))
    console.log('')

    const verificationResult = {
      type: 'verification_result',
      agentId: 'nft-royalty-agent',
      proposalId: `royalty-${royalty.nftId}-${Date.now()}`,
      approved: true,
      reasoning: `Royalty approved: ${royalty.royaltyPercentage}% of $${royalty.salePrice} = $${royalty.royaltyAmount.toFixed(2)} for NFT ${royalty.nftId}`,
      paymentDetails: {
        amount: (royalty.royaltyAmount * 1000000).toString(), // USDC atomic units (6 decimals)
        asset: process.env.USDC_CONTRACT || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        payTo: royalty.creatorAddress,
        description: `NFT Royalty: ${royalty.nftId}`
      }
    }

    try {
      await settlement.triggerSettlement(verificationResult)
      
      console.log(chalk.bold.green('\n✅ NFT ROYALTY PAYMENT EXECUTED!\n'))
      console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

      // Phase 4: Settlement Summary
      console.log(chalk.bold.yellow('📊 Phase 4: Settlement Summary\n'))
      
      console.log(chalk.green('✅ Payment Status: COMPLETED'))
      console.log(`   NFT: ${royalty.nftId}`)
      console.log(`   Sale Price: $${royalty.salePrice.toFixed(2)}`)
      console.log(`   Royalty Rate: ${royalty.royaltyPercentage}%`)
      console.log(`   Royalty Amount: $${royalty.royaltyAmount.toFixed(2)}`)
      console.log(`   Network: Base Sepolia`)
      console.log(`   Asset: USDC`)
      console.log(`   Creator: ${royalty.creatorAddress}`)
      console.log('')

      console.log(chalk.blue('🔗 Transaction Details:'))
      console.log(chalk.gray('   Check terminal output above for transaction hash'))
      console.log(chalk.gray('   Explorer: https://sepolia.basescan.org'))
      console.log('')

      // Benefits showcase
      console.log(chalk.bold.cyan('💡 Why x402 for NFT Royalties?'))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   ✅ Automatic royalty calculation (10%)')
      console.log('   ✅ Cross-chain settlements (Hedera → Base)')
      console.log('   ✅ Creator gets paid instantly')
      console.log('   ✅ Transparent payment trail')
      console.log('   ✅ No manual intervention needed')
      console.log('   ✅ Supports any creator preference (HBAR/USDC/etc)')
      console.log('   ✅ Low fees ($0.02-$0.05 vs higher manual costs)')
      console.log('')

      // Business impact
      console.log(chalk.bold.magenta('💼 Business Impact:'))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   • Automated royalty distribution')
      console.log('   • Reduces manual processing time (hours → seconds)')
      console.log('   • Ensures creator always gets paid')
      console.log('   • Works across networks (Hedera, EVM, etc)')
      console.log('   • Immutable payment records')
      console.log('')

    } catch (error) {
      console.log(chalk.red(`\n❌ Payment failed: ${error instanceof Error ? error.message : String(error)}`))
      console.log(chalk.yellow('\n💡 Possible causes:'))
      console.log(chalk.gray('   • Insufficient USDC balance on Base Sepolia'))
      console.log(chalk.gray('   • Network connectivity issues'))
      console.log(chalk.gray('   • Check wallet status: npm run check:wallets'))
      console.log(chalk.gray('   • Get USDC at: https://portal.hedera.com'))
      throw error
    }

    console.log(chalk.bold.green('🎉 NFT ROYALTY SETTLEMENT COMPLETE!\n'))

  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error)
    throw error
  }
}

// Run the demo
nftRoyaltySettlementDemo()
  .then(() => {
    console.log(chalk.green('\n✅ Demo completed successfully!'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Demo failed:'), error)
    process.exit(1)
  })
