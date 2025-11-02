# Aether Setup Guide

Complete guide to set up and run Aether on Solana devnet.

---

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Solana CLI** (optional): For key generation
- **Git**: For cloning the repository

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/4n0nn43x/Aether.git
cd Aether
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate a Wallet

**Option A: Using Solana CLI**

```bash
solana-keygen new --outfile ~/.config/solana/agent-wallet.json
```

Extract the private key:
```bash
solana-keygen pubkey ~/.config/solana/agent-wallet.json
# This shows your public key

# To get the private key in base58 format:
cat ~/.config/solana/agent-wallet.json
# Copy the array of numbers and convert to base58 using a tool
```

**Option B: Using JavaScript**

```javascript
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

const keypair = Keypair.generate()
console.log('Public Key:', keypair.publicKey.toBase58())
console.log('Private Key (base58):', bs58.encode(keypair.secretKey))
```

### 4. Get Devnet Funds

**Get SOL for transaction fees:**

```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

**Get USDC for payments:**

Visit [Circle USDC Faucet](https://faucet.circle.com/) and request devnet USDC.

Alternatively, use Solana devnet faucet tools or community faucets.

### 5. Configure Environment

```bash
cp env.example .env
```

Edit `.env`:

```env
# Solana Network Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Agent Wallet (base58 encoded private key)
AGENT_PRIVATE_KEY=your_base58_private_key_here

# USDC Mint on Solana Devnet
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Merchant Wallet (where payments will be sent)
MERCHANT_WALLET_ADDRESS=merchant_wallet_address_here

# Payment Configuration
DEFAULT_PAYMENT_AMOUNT_USDC=1.0

# Optional: AI Features
# OPENAI_API_KEY=sk-...

# Agent Identifiers (optional)
ANALYZER_AGENT_ID=analyzer-01
VERIFIER_AGENT_ID=verifier-01
SETTLEMENT_AGENT_ID=settlement-01
```

### 6. Build the Project

```bash
npm run build
```

### 7. Run a Demo

```bash
# Show available demos
npm run demo

# Run x402 payment demo
npm run demo:payment
```

---

## Configuration Details

### Solana Network Options

**Devnet (Recommended for testing)**
```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Mainnet (Production)**
```env
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Or use a dedicated RPC provider for better performance
```

### USDC Mint Addresses

**Devnet:**
```
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Mainnet:**
```
EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### Private Key Format

Aether expects private keys in **base58 format**.

Example:
```
5JvmtPGmUhW8Y3sSBvPh6K3f2Tk9Jx7rN5qP4cL9mW2d...
```

---

## Troubleshooting

### Error: "Insufficient SOL balance"

**Solution**: Get more SOL from the faucet
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

### Error: "Insufficient USDC balance"

**Solution**: Request USDC from Circle faucet or community faucets

### Error: "Agent wallet not initialized"

**Solution**: Verify your `AGENT_PRIVATE_KEY` is correctly set in `.env`

### Error: "Invalid base58 string"

**Solution**: Ensure your private key is in base58 format, not raw bytes

### RPC Rate Limiting

If you encounter rate limiting on public RPC:

**Option 1**: Use a dedicated RPC provider
- [Helius](https://helius.dev)
- [QuickNode](https://quicknode.com)
- [Alchemy](https://alchemy.com)

**Option 2**: Add delays between transactions

```typescript
await new Promise(resolve => setTimeout(resolve, 1000))
```

---

## Verifying Your Setup

### Check Wallet Balance

```bash
solana balance YOUR_ADDRESS --url devnet
```

### Check USDC Balance

Use Solana Explorer:
```
https://explorer.solana.com/address/YOUR_ADDRESS?cluster=devnet
```

### Test Transaction

Run the payment demo:
```bash
npm run demo:payment
```

Expected output:
```
✅ Facilitator initialized with wallet: <address>
✅ Settlement Agent initialized with wallet: <address>
✅ Payment settled successfully!
📋 Transaction Signature: <signature>
🔗 Explorer: https://explorer.solana.com/tx/<signature>?cluster=devnet
```

---

## Next Steps

- Read the [API Reference](./API_REFERENCE.md)
- Explore [Usage Examples](./USAGE_GUIDE.md)
- Learn about [x402 Integration](./X402_GUIDE.md)

---

## Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/4n0nn43x/Aether/issues)
2. Review this setup guide
3. Verify your environment configuration
4. Check Solana network status

---

**Ready to build autonomous agents on Solana!** 🚀
