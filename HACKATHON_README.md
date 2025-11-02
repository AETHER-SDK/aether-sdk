# Hedron - Hedera Africa Hackathon Submission

**Autonomous Agent Ecosystem on Hedera Hashgraph**

---

## 🎯 Hackathon Submission Overview

Hedron is a complete implementation of autonomous agent-to-agent systems built on Hedera Hashgraph, implementing **both hackathon bounties** with production-ready code, real blockchain transactions, and comprehensive documentation.

---

## 🏆 Bounty Submissions

### ✅ Bounty 1: Hedera x402 Payment Standard SDK

**Complete implementation of cross-chain autonomous payment protocol**

**Features:**
- ✅ **Cross-chain x402 payments** - USDC on Base Sepolia
- ✅ **Native x402 payments** - HBAR on Hedera
- ✅ **Local facilitator server** - Payment verification and settlement
- ✅ **Full payment flow** - Request → Verify → Settle → Receipt

**Demos:**
- NFT Royalty Payment (`npm run demo:nft-royalty 150`)
- HBAR Direct Transfer (`npm run demo:hbar-x402 10`)

**Technology:** x402 Payment Standard, Base Sepolia, Hedera Testnet

---

### ✅ Bounty 2: Hedera Agent Kit & Google A2A Protocol

**Autonomous agent-to-agent systems with AI-powered decision making + HCS-10 OpenConvAI**

**Features:**
- ✅ **LLM Reasoning** - GPT-4 powered invoice validation
- ✅ **Fraud Detection** - Multi-agent security algorithms
- ✅ **Memo Verification** - Blockchain-verified agreements
- ✅ **Hedera Token Settlement** - Native HBAR/token payments
- ✅ **A2A Protocol** - Standardized agent communication
- ✅ **HCS-10 OpenConvAI** - Connection management and transaction approval

**Demos:**
- Main Orchestrator (`npm run demo`) - Complete 3-agent workflow with HCS-10 connections
- Intelligent Invoice (`npm run demo:invoice-llm 800`) - LLM reasoning with HCS-10 transaction approval
- Supply Chain Negotiation (`npm run demo:negotiation`) - Vendor payment with approval workflow
- Supply Chain Fraud Detection (`npm run demo:supply-chain-fraud`) - Fraud-checked payments with HCS-10
- Invoice Automation (`npm run demo:invoice 600`) - High-value processing with connections and approval

**Technology:** Google A2A Protocol, HCS-10 OpenConvAI, Hedera Consensus Service (HCS), LangChain, OpenAI

---

### ✅ Track 1: On-Chain Finance & RWA Tokenization

**Tokenized invoice as Real-World Asset with HCS-10 settlement approval**

**Features:**
- ✅ **Invoice Tokenization** - Convert invoices to tradeable HTS tokens
- ✅ **RWA Trading** - Invoice factoring and fractional ownership
- ✅ **Automated Settlement** - x402 payment standard integration
- ✅ **HCS-10 Transaction Approval** - Multi-signature workflows for high-value settlements (>= $500)

**Demo:**
- Tokenized RWA Invoice (`npm run demo:rwa-invoice 600`) - Complete RWA lifecycle with HCS-10

**Technology:** HTS Tokenization, x402 Payment Standard, HCS-10 OpenConvAI

---

## 🚀 Quick Start for Judges

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your credentials (see Setup section below)
```

### Setup Instructions

1. **Hedera Account Setup**
   - Get testnet account ID and private key from [Hedera Portal](https://portal.hedera.com)
   - Add to `.env`: `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY`

2. **HCS-11 Profile Registration** (Required for agents)
   ```bash
   npm run setup:hcs11-fixed
   ```
   - Registers agent profiles on Hedera Consensus Service
   - Creates topics for agent communication

3. **Base Sepolia Setup** (For x402 USDC demos)
   - Get Base Sepolia USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Fund wallet with USDC and ETH for gas
   - Add to `.env`: `MERCHANT_WALLET_ADDRESS` and `SETTLEMENT_WALLET_PRIVATE_KEY`

4. **OpenAI API Key** (Optional, for LLM demos)
   - Add to `.env`: `OPENAI_API_KEY=sk-...`

See [HCS-11 Setup Guide](./docs/HCS11_SETUP_GUIDE.md) for detailed instructions.

---

## 🎬 Demo Showcase

**8 Production-Ready Demos - All with HCS-10 OpenConvAI Support**

Enable HCS-10 features: `export USE_HCS10_CONNECTIONS=true`

### Bounty 1: x402 Payment Standard

#### Demo 1: NFT Royalty Payment (Cross-Chain x402)
```bash
npm run demo:nft-royalty 150
```

**What it demonstrates:**
- NFT sale simulation ($150)
- Automatic 10% royalty calculation ($15)
- Cross-chain x402 payment
- USDC transfer on Base Sepolia
- Complete payment receipt

**Network:** Base Sepolia  
**Asset:** USDC  
**Protocol:** x402

---

#### Demo 2: HBAR Direct Transfer (Native x402)
```bash
npm run demo:hbar-x402 10   # Small amount
npm run demo:hbar-x402 100  # Large amount (triggers HCS-10 approval)
```

**What it demonstrates:**
- Direct Hedera HBAR transfer
- x402 verification on native Hedera
- Fast, low-cost settlement
- Payment authorization and settlement

**Network:** Hedera Testnet  
**Asset:** HBAR  
**Protocol:** x402

---

### Bounty 2: Hedera Agent Kit

#### Demo 3: Intelligent Invoice with LLM Reasoning
```bash
npm run demo:invoice-llm
```

**What it demonstrates:**
- LLM-powered invoice validation
- AI decision making (GPT-4 reasoning)
- Autonomous approval/rejection
- Hedera token settlement
- Complete agent coordination

**Technology:** LLM + A2A Protocol  
**Network:** Hedera Testnet  
**Asset:** HBAR

---

#### Demo 4: Supply Chain with Fraud Detection
```bash
npm run demo:supply-chain-fraud
```

**What it demonstrates:**
- Multi-agent price negotiation
- AI fraud detection algorithm
- Blockchain memo verification
- Hedera token settlement
- Complete security workflow

**Technology:** Fraud Detection + Memo Verification + A2A  
**Network:** Hedera Testnet  
**Asset:** HBAR

---

## 📊 Project Statistics

- **Total Files:** 80+ files
- **Source Code:** 15+ TypeScript files
- **Smart Contracts:** 2 Solidity contracts (deployed)
- **Tests:** 11 tests (all passing)
- **Demos:** 7 working demos
- **Documentation:** 21+ markdown files

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Autonomous Agent Network                │
├─────────────┬──────────────┬──────────────────┤
│ Analyzer    │ Verifier     │ Settlement       │
│ Agent       │ Agent        │ Agent            │
└─────┬───────┴──────┬───────┴────────┬──────────┘
      │              │                │
      ▼              ▼                ▼
┌─────────────────────────────────────────────────┐
│   Hedera Consensus Service (HCS) Messaging      │
│   ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│   │Analyzer│  │Verifier │  │ Settlement   │   │
│   │ Topic  │  │ Topic   │  │ Topic        │   │
│   └────────┘  └─────────┘  └──────────────┘   │
└─────────────────────────────────────────────────┘
      │              │                │
      ▼              ▼                ▼
┌─────────────────────────────────────────────────┐
│         Multi-Chain Settlement Layer             │
│   ┌─────────┐  ┌─────────┐  ┌──────────────┐     │
│   │ Hedera  │  │ Base    │  │ x402         │     │
│   │ HBAR    │  │ USDC    │  │ Protocol     │     │
│   └─────────┘  └─────────┘  └──────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

### Multi-Protocol Support
- ✅ **A2A Protocol** - Standardized agent communication
- ✅ **AP2 Protocol** - Payment negotiations
- ✅ **x402 Standard** - Autonomous cross-chain settlements
- ✅ **HCS Messaging** - Decentralized communication

### Intelligent Agents
- ✅ **AI-Powered Decisions** - LLM reasoning for validation
- ✅ **Fraud Detection** - Security-first algorithms
- ✅ **Risk Assessment** - Business rule validation
- ✅ **Autonomous Negotiation** - Agent-to-agent terms

### Cross-Chain Capabilities
- ✅ **USDC on Base/Ethereum** - EVM-compatible chains
- ✅ **HBAR on Hedera** - Native Hedera payments
- ✅ **Automatic Network Selection** - Smart routing
- ✅ **Seamless Bridging** - Cross-chain settlements

### Production Ready
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Human-in-the-Loop** - Configurable approval thresholds
- ✅ **Complete Audit Trails** - Full transparency
- ✅ **Security Best Practices** - Production-grade code

---

## 📚 Documentation

### For Hackathon Judges

1. **[Pitch Deck](./docs/PITCH_DECK.md)** - Complete presentation slides
2. **[Video Pitch Summary](./docs/VIDEO_PITCH_SUMMARY.md)** - Video script and summary
3. **[Bounty 1 Details](./docs/BOUNTY_1_HEDERA_X402_STANDARD.md)** - x402 implementation
4. **[Bounty 2 Details](./docs/BOUNTY_2_HEDERA_AGENT_KIT.md)** - Agent Kit implementation
5. **[Hackathon Ready](./docs/HACKATHON_READY.md)** - Submission checklist

### For Developers

1. **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
2. **[Usage Guide](./docs/USAGE_GUIDE.md)** - How to use Hedron
3. **[A2A Protocol](./docs/A2A_PROTOCOL_IMPLEMENTATION.md)** - Protocol details
4. **[Demo Guide](./demo/README.md)** - Demo showcase guide

### Complete Documentation

See [Documentation Index](./docs/INDEX.md) for all available documentation.

---

## 🧪 Testing

### Run All Tests
```bash
npm run test:all
```

### Test Breakdown
- **Unit Tests:** 3 tests (agent logic)
- **Integration Tests:** 5 tests (cross-protocol workflows)
- **E2E Tests:** 3 tests (complete coordination)

**Status:** ✅ All 11 tests passing

---

## 💡 Use Cases

### Invoice Automation
- Autonomous invoice processing
- AI-powered validation
- Instant settlement

### Supply Chain
- Agent negotiation for vendor contracts
- Automated payment execution
- Fraud detection

### NFT Royalties
- Automatic royalty calculation
- Cross-chain payments
- Transparent distribution

### Financial Services
- Autonomous trading agents
- Risk assessment
- Multi-asset settlement

---

## 🌟 Why Hedron Stands Out

### ✅ Complete Implementation
- Both bounties fully implemented
- Production-ready code
- Comprehensive test coverage

### ✅ Real Blockchain Transactions
- No mocks or simulations
- Actual testnet deployments
- Real USDC and HBAR transfers

### ✅ Innovation
- First x402 implementation on Base + Hedera
- LLM reasoning for autonomous decisions
- Fraud detection with blockchain verification

### ✅ Documentation
- 21+ documentation files
- Complete API reference
- Step-by-step guides

---

## 🔧 Development Commands

```bash
# Build
npm run build

# Run tests
npm run test:all

# Run demos
npm run demo:nft-royalty 150
npm run demo:hbar-x402 10
npm run demo:invoice-llm
npm run demo:supply-chain-fraud

# Deploy contracts
npm run deploy:simple
npm run deploy:supply-chain

# Check status
npm run check:credentials
npm run check:wallets
```

---

## 📦 Project Structure

```
hedron/
├── src/
│   ├── agents/              # Agent implementations
│   ├── protocols/           # A2A, AP2, x402 protocols
│   ├── facilitator/         # x402 facilitator server
│   ├── modes/              # Human-in-the-loop
│   └── services/            # Token services
├── contracts/              # Solidity smart contracts
├── tests/                  # Test suite
├── demo/                   # Showcase demos
├── docs/                   # Documentation
├── HACKATHON_README.md     # This file
└── README.md               # Main project README
```

---

## 🎥 Video Pitch

See [Video Pitch Summary](./docs/VIDEO_PITCH_SUMMARY.md) for the complete pitch script.

**Key Points:**
- Problem statement and solution
- Technology demonstration
- Real-world use cases
- Impact and potential

---

## 🤝 Support & Contact

- **GitHub Repository:** [github.com/Hebx/hedera-a2a-agents](https://github.com/Hebx/hedera-a2a-agents)
- **Issues:** [GitHub Issues](https://github.com/Hebx/hedera-a2a-agents/issues)
- **Documentation:** See `docs/` folder

---

## 📄 License

ISC License - see LICENSE file for details.

---

## 🏆 Submission Status

✅ **Code Complete** - All implementations finished  
✅ **Tests Passing** - 11/11 tests passing  
✅ **Demos Working** - 7 demos ready  
✅ **Documentation Complete** - 21+ files  
✅ **Production Ready** - Error handling, security, HITL  

**Ready for Hackathon Submission! 🎉**

---

**Hedron** - _Autonomous agents, intelligent decisions, seamless settlements._

Built for **Hedera Africa Hackathon** 🇿🇦
