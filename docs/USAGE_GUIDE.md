# Hedron Usage Guide

Complete guide to using Hedron for autonomous agent workflows, x402 payments, and multi-protocol integrations.

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/Hebx/hedera-a2a-agents.git
cd hedera-a2a-agents
npm install
cp env.example .env
```

### 2. Configuration

Edit `.env` with your credentials:

```bash
# Hedera Network
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e0201...

# Payment Configuration
PAYMENT_NETWORK=base-sepolia  # or 'hedera-testnet'
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
MERCHANT_WALLET_ADDRESS=0x...

# Base Sepolia (for USDC)
SETTLEMENT_WALLET_PRIVATE_KEY=0x...
BASE_RPC_URL=https://sepolia.base.org

# AI Integration (optional)
OPENAI_API_KEY=sk-...  # For LLM reasoning
```

### 3. Setup HCS-11 Profile

```bash
npm run setup:hcs11-fixed
```

See [HCS-11 Setup Guide](./HCS11_SETUP_GUIDE.md) for detailed instructions.

---

## 💡 Common Use Cases

### Use Case 1: Autonomous Invoice Processing

**Scenario**: Automatically process invoices with AI validation.

```bash
npm run demo:invoice-llm
```

**Features**:

- LLM analyzes invoice context
- Fraud detection
- Automatic approval/rejection
- Hedera token settlement

See [Invoice Automation Guide](./BOUNTY_2_HEDERA_AGENT_KIT.md#use-case-1-invoice-automation) for details.

### Use Case 2: Supply Chain Negotiation

**Scenario**: Autonomous multi-agent price negotiation.

```bash
npm run demo:negotiation
```

**Features**:

- Buyer and vendor agents negotiate
- Multiple negotiation rounds
- Agreement recorded on Hedera
- Automatic settlement

See [Supply Chain Guide](./BOUNTY_2_HEDERA_AGENT_KIT.md#use-case-2-supply-chain-negotiation) for details.

### Use Case 3: NFT Royalty Settlement

**Scenario**: Automatically pay NFT creators with cross-chain x402.

```bash
npm run demo:nft-royalty 150
```

**Features**:

- Automatic 10% royalty calculation
- Cross-chain payment to creator
- USDC on Base Sepolia
- Transparent payment trail

See [NFT Royalty Guide](./BOUNTY_1_HEDERA_X402_STANDARD.md#nft-royalty-settlement) for details.

### Use Case 4: Fraud Detection & Verification

**Scenario**: Secure payments with AI fraud detection and blockchain memo verification.

```bash
npm run demo:supply-chain-fraud
```

**Features**:

- AI-powered fraud detection
- Memo verification on Hedera
- Secure settlement
- Complete audit trail

See [Fraud Detection Guide](./BOUNTY_2_HEDERA_AGENT_KIT.md#use-case-fraud-detection) for details.

---

## 🔧 Configuration Options

### Payment Network Selection

Choose between Hedera (HBAR) or Base Sepolia (USDC):

```bash
# For USDC on Base Sepolia
export PAYMENT_NETWORK=base-sepolia

# For HBAR on Hedera
export PAYMENT_NETWORK=hedera-testnet
```

### Human-in-the-Loop (HITL)

Configure approval thresholds:

```bash
# .env
HITL_PAYMENT_THRESHOLD=500  # Require approval for payments > $500
HITL_ENABLED=true
```

See [Human-in-the-Loop Guide](./HUMAN_IN_THE_LOOP.md) for details.

---

## 📡 Agent Communication

### A2A Protocol

Agents communicate via Hedera Consensus Service (HCS) using the A2A protocol.

See [A2A Protocol Implementation](./A2A_PROTOCOL_IMPLEMENTATION.md) for details.

### Payment Protocols

- **AP2**: Agent-to-agent payment negotiations
- **x402**: Autonomous payment settlement

See [x402 Payment Standard](./BOUNTY_1_HEDERA_X402_STANDARD.md) for details.

---

## 🧪 Running Tests

### Unit Tests

```bash
npm run test:analyzer      # Test AnalyzerAgent
npm run test:verifier      # Test VerifierAgent
npm run test:settlement    # Test SettlementAgent
```

### Integration Tests

```bash
npm run test:a2a-protocol  # Test A2A integration
npm run test:x402-complete # Test x402 complete flow
```

### All Tests

```bash
npm run test:all
```

---

## 🎬 Demo Showcases

### Bounty 1: x402 Payment Standard

```bash
# Cross-chain NFT royalty (USDC on Base)
npm run demo:nft-royalty 150

# Native HBAR settlement
npm run demo:hbar-x402 10
```

### Bounty 2: Hedera Agent Kit

```bash
# LLM-powered invoice validation
npm run demo:invoice-llm

# Fraud detection with memo verification
npm run demo:supply-chain-fraud
```

### Complete Workflows

```bash
# Full 3-agent coordination
npm run demo

# Invoice automation
npm run demo:invoice

# Supply chain negotiation
npm run demo:negotiation
```

---

## 📚 Next Steps

1. **Read the README** - Start with the main overview
2. **Choose a use case** - Pick a demo that matches your needs
3. **Explore documentation** - See [Documentation Index](./INDEX.md)
4. **Run demos** - Try the showcase demos
5. **Review tests** - Review test implementations

---

## 🔗 Additional Resources

- [Complete Documentation Index](./INDEX.md) - All available docs
- [API Reference](./API_REFERENCE.md) - Complete API docs
- [Hackathon Submission](./HACKATHON_READY.md) - Submission details
- [Bounty Guides](./BOUNTY_1_HEDERA_X402_STANDARD.md) - Bounty information

---

## 💡 Tips

### For Development

- Start with unit tests to understand agent behavior
- Use `check:credentials` to verify configuration
- Check `check:wallets` to verify wallet status

### For Production

- Configure HITL for high-value transactions
- Set up proper error handling
- Monitor HCS topic messages
- Use multiple network fallbacks

### For Demos

- Run demos in order: setup → test → showcase
- Check transaction IDs on explorers
- Monitor terminal output for errors
- Verify wallet balances before running

---

**Ready to build?** Start with [Installation](#-getting-started) and choose a use case that fits your needs.
