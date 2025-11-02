# Hedron

**Autonomous Agent Ecosystem SDK for Hedera Hashgraph**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-green.svg)](https://hedera.com)

Hedron is a complete SDK and framework for building autonomous agent-to-agent systems on the Hedera network. It combines Google's A2A Protocol, x402 Payment Standard, and Hedera Consensus Service (HCS) to enable truly autonomous, multi-protocol agent communication and settlement.

---

## 🌟 Vision

**Hedron** envisions a future where autonomous agents orchestrate complex workflows across blockchain networks—negotiating contracts, processing payments, detecting fraud, and making intelligent decisions—all without human intervention.

Our ecosystem integrates:

- **AP2 Protocol** - Agent-to-agent payment negotiations
- **A2A Protocol** - Standardized agent communication
- **x402 Payment Standard** - Autonomous cross-chain settlements
- **Hedera HCS** - Decentralized messaging infrastructure

---

## 🎯 What Is Hedron?

Hedron is both a **production-ready SDK** and a **complete framework** that enables:

### 🔄 Autonomous Workflows

- **Agent Negotiation**: Buyers and sellers negotiate terms autonomously
- **Intelligent Verification**: LLM-powered decision making and fraud detection
- **Automated Settlement**: Cross-chain payments executed without intermediaries

### 🌐 Multi-Chain Support

- **Hedera Network**: Native HBAR transfers, HCS messaging, fast finality
- **EVM Chains**: USDC on Base, Ethereum, or any EVM-compatible network
- **Cross-Chain**: Seamless settlements across networks

### 🤖 Smart Agents

- **AnalyzerAgent**: Queries account data, generates insights, proposes actions
- **VerifierAgent**: Validates proposals, applies business rules, makes decisions
- **SettlementAgent**: Executes payments via x402, records settlements on-chain
- **IntelligentVerifierAgent**: AI-powered validation with GPT-4 reasoning

---

## 📦 SDK Installation

Hedron is available as an npm package for easy integration into your projects.

### Install

```bash
npm install hedron-agent-sdk
```

### Quick Start

```typescript
import { 
  AnalyzerAgent, 
  VerifierAgent, 
  SettlementAgent,
  A2AProtocol 
} from 'hedron-agent-sdk'

// Initialize an agent
const agent = new AnalyzerAgent()
await agent.init()

// Query account data
const accountInfo = await agent.queryAccount('0.0.123456')
```

### SDK Documentation

- **[SDK README](./SDK_README.md)** - Complete SDK installation and usage guide
- **[API Reference](./docs/API_REFERENCE.md)** - Full API documentation
- **[Usage Guide](./docs/USAGE_GUIDE.md)** - Integration examples

---

## 🎬 Demos & Examples

Hedron includes **8 production-ready demos** showcasing real-world use cases with actual blockchain transactions. All demos support **HCS-10 OpenConvAI Protocol** for enhanced security and auditability.

### 🔗 HCS-10 OpenConvAI Protocol

All demos include optional HCS-10 features:
- **Connection Management** - Establish trusted agent connections
- **Transaction Approval** - Multi-signature workflows for high-value transactions
- **Fee-Based Connections** - Agent monetization support
- **Enhanced Audit Trail** - Complete on-chain transaction history

Enable HCS-10: `export USE_HCS10_CONNECTIONS=true`

---

### Bounty 1: x402 Payment Standard Demos

#### 1. NFT Royalty Payment (Cross-Chain x402)
```bash
npm run demo:nft-royalty 150
```

**Demonstrates:**
- NFT sale simulation ($150)
- Automatic 10% royalty calculation ($15)
- Cross-chain x402 payment execution
- USDC transfer on Base Sepolia
- Fee-based connection configuration (HCS-10)
- Complete payment receipt

**Network:** Base Sepolia | **Asset:** USDC | **Protocol:** x402

#### 2. HBAR Direct Transfer (Native x402)
```bash
npm run demo:hbar-x402 10    # Small amount
npm run demo:hbar-x402 100   # Large amount (triggers HCS-10 approval)
```

**Demonstrates:**
- Direct Hedera HBAR transfer
- x402 verification on native Hedera
- Fast, low-cost settlement
- **HCS-10 transaction approval** for large amounts (>=50 HBAR)
- Payment authorization and settlement

**Network:** Hedera Testnet | **Asset:** HBAR | **Protocol:** x402

---

### Bounty 2: Hedera Agent Kit Demos

#### 3. Main Orchestrator (Complete 3-Agent Workflow)
```bash
npm run demo 0.0.XXXXXX 10 hedera-testnet
```

**Demonstrates:**
- Complete 3-agent coordination (Analyzer → Verifier → Settlement)
- **HCS-10 connection establishment** between agents
- Connection-based proposal messaging
- **HCS-10 transaction approval** for HBAR payments
- Cross-chain settlement execution
- Full autonomous workflow

**Technology:** A2A Protocol + HCS-10 | **Network:** Hedera Testnet | **Asset:** HBAR

#### 4. Intelligent Invoice with LLM Reasoning
```bash
npm run demo:invoice-llm 150      # Low-value (auto-approved)
npm run demo:invoice-llm 800      # High-value (HCS-10 approval)
```

**Demonstrates:**
- LLM-powered invoice validation (GPT-4)
- AI decision making with reasoning
- **HCS-10 transaction approval** replaces CLI HITL prompts
- On-chain storage of LLM reasoning in transaction memo
- Autonomous approval/rejection
- Hedera token settlement

**Technology:** LLM + A2A Protocol + HCS-10 | **Network:** Hedera Testnet | **Asset:** HBAR

#### 5. Supply Chain Negotiation
```bash
npm run demo:negotiation
```

**Demonstrates:**
- Multi-agent price negotiation
- Vendor payment workflow
- **HCS-10 transaction approval** for vendor payments
- Multi-signature approval before execution
- Hedera token settlement

**Technology:** A2A Protocol + HCS-10 | **Network:** Hedera Testnet | **Asset:** HBAR

#### 6. Supply Chain Fraud Detection
```bash
npm run demo:supply-chain-fraud
```

**Demonstrates:**
- Multi-agent price negotiation
- AI fraud detection algorithms
- Blockchain memo verification
- **HCS-10 transaction approval** for fraud-checked payments
- Enhanced security with multi-signature approval
- Hedera token settlement

**Technology:** Fraud Detection + Memo Verification + A2A + HCS-10 | **Network:** Hedera Testnet | **Asset:** HBAR

#### 7. Invoice Automation
```bash
npm run demo:invoice 150      # Low-value (direct execution)
npm run demo:invoice 600      # High-value (HCS-10 approval)
```

**Demonstrates:**
- Automated invoice processing
- **HCS-10 connection establishment** between Analyzer and Verifier
- Agent-to-agent communication via connections
- **HCS-10 transaction approval** for high-value invoices (>= $500)
- Human-in-the-loop integration
- Cross-chain payment support

**Technology:** A2A Protocol + HCS-10 + x402 | **Network:** Hedera Testnet + Base Sepolia | **Asset:** HBAR/USDC

---

### Track 1: RWA Tokenization

#### 8. Tokenized RWA Invoice
```bash
npm run demo:rwa-invoice 250      # Low-value
npm run demo:rwa-invoice 600      # High-value (HCS-10 approval)
```

**Demonstrates:**
- Invoice tokenization as Real-World Asset (RWA)
- Hedera Token Service (HTS) token creation
- RWA token trading/transfer (invoice factoring)
- **HCS-10 transaction approval** for high-value settlements (>= $500)
- Automated settlement via x402 payment standard
- Cross-chain payment execution (HBAR or USDC)
- Complete RWA lifecycle on-chain

**Technology:** HTS Tokenization + x402 + HCS-10 | **Network:** Hedera Testnet + Base Sepolia | **Asset:** HTS Tokens + HBAR/USDC

---

### Demo Feature Matrix

| Demo | HCS-10 Connections | HCS-10 Approval | Network | Asset | Command |
|------|-------------------|-----------------|---------|-------|---------|
| Orchestrator | ✅ | ✅ (HBAR) | Hedera | HBAR | `npm run demo` |
| NFT Royalty | ✅ (fee config) | ❌ | Base | USDC | `npm run demo:nft-royalty 150` |
| HBAR Direct | ❌ | ✅ (>=50 HBAR) | Hedera | HBAR | `npm run demo:hbar-x402 100` |
| Intelligent Invoice | ❌ | ✅ (>= $500) | Hedera | HBAR | `npm run demo:invoice-llm 800` |
| Supply Chain Negotiation | ❌ | ✅ | Hedera | HBAR | `npm run demo:negotiation` |
| Supply Chain Fraud | ❌ | ✅ | Hedera | HBAR | `npm run demo:supply-chain-fraud` |
| Invoice Automation | ✅ | ✅ (>= $500) | Hedera/Base | HBAR/USDC | `npm run demo:invoice 600` |
| RWA Invoice | ❌ | ✅ (>= $500) | Hedera/Base | HBAR/USDC | `npm run demo:rwa-invoice 600` |

```bash
npm run demo                    # Complete 3-agent workflow
npm run demo:invoice            # Invoice automation
npm run demo:negotiation        # Supply chain negotiation
npm run demo:rwa-invoice        # Tokenized RWA invoice demo
```

### Demo Documentation

- **[Demo Guide](./demo/README.md)** - Complete demo showcase guide
- **[Bounty 1 Details](./docs/BOUNTY_1_HEDERA_X402_STANDARD.md)** - x402 implementation
- **[Bounty 2 Details](./docs/BOUNTY_2_HEDERA_AGENT_KIT.md)** - Agent Kit implementation

---

## 🏆 Hackathon Submission

Hedron was built for the **Hedera Africa Hackathon**, implementing both bounties with production-ready code:

- ✅ **Bounty 1: Hedera x402 Payment Standard SDK** - Complete cross-chain payment protocol
- ✅ **Bounty 2: Hedera Agent Kit & Google A2A Protocol** - Autonomous agent systems with AI-powered decision making

### Quick Hackathon Overview

**What We Built:**
- 80+ files of production-ready code
- 11 passing tests (unit, integration, e2e)
- 7 working demos with real blockchain transactions
- 21+ comprehensive documentation files
- 2 deployed smart contracts

**Key Highlights:**
- First x402 implementation connecting Hedera and Base
- LLM reasoning for autonomous invoice validation
- Fraud detection with blockchain memo verification
- Multi-protocol agent communication (A2A, AP2, x402)

📖 **[Read Complete Hackathon README](./HACKATHON_README.md)** for full submission details, setup instructions, and demo walkthroughs.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Network                          │
├──────────────────┬──────────────────┬──────────────────┤
│ AnalyzerAgent    │  VerifierAgent   │ SettlementAgent  │
│                  │                  │                  │
│ • Query Data     │ • Validate       │ • x402 Payments  │
│ • Generate       │ • Approve/Reject │ • Cross-Chain    │
│   Proposals      │ • AI Reasoning   │ • Settlement     │
└────────┬─────────┴─────────┬─────────┴─────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│      Hedera Consensus Service (HCS) Messaging          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Analyzer │  │ Verifier │  │ Settlement   │         │
│  │ Topic    │  │ Topic    │  │ Topic        │         │
│  └──────────┘  └──────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│            Multi-Chain Settlement Layer                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Hedera   │  │ Base     │  │ x402         │         │
│  │ HBAR     │  │ USDC     │  │ Protocol     │         │
│  └──────────┘  └──────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Use Cases

Hedron enables autonomous systems across multiple industries:

### 🧾 Invoice Automation

- **Autonomous Processing**: AI analyzes invoices, validates business rules, and approves payments
- **Fraud Detection**: ML algorithms flag suspicious transactions
- **Instant Settlement**: Automated USDC or HBAR transfers

### 📦 Supply Chain

- **Agent Negotiation**: Buyer and vendor agents negotiate terms autonomously
- **Agreement Recording**: Smart contracts record finalized terms on Hedera
- **Automated Payments**: x402 protocol executes settlements

### 🎨 NFT Royalties

- **Automatic Calculation**: 10% royalty calculated on each NFT sale
- **Cross-Chain Payments**: Creators receive USDC on preferred network
- **Transparent Trail**: All payments recorded on blockchain

### 💰 Financial Services

- **Autonomous Trading**: Agents execute trades based on market conditions
- **Risk Management**: AI evaluates risk and makes decisions
- **Multi-Asset Settlement**: USDC, HBAR, or any supported token

### 🔒 Security & Compliance

- **Fraud Detection**: AI analyzes transaction patterns
- **Memo Verification**: Blockchain-verified agreement recording
- **Audit Trails**: Complete transparency via HCS

---

## 💼 Real-World SDK Use Cases

See comprehensive real-world use cases with complete code examples:

📖 **[Real-World Use Cases Guide](./docs/REAL_WORLD_USE_CASES.md)** - 6 production-ready examples including:
- E-Commerce Payment Platform (Stripe-like)
- B2B Supply Chain Platform (automated procurement)
- Freelancer Marketplace (automated payouts)
- SaaS Subscription Billing (multi-chain)
- NFT Marketplace (royalty distribution)
- Invoice Factoring Platform (RWA tokenization)

Each use case includes TypeScript code examples, business impact metrics, and implementation scenarios.

---

## 🗺️ Roadmap & Real-World Adoption

### Phase 1: Launch ✅ (Complete)
- Core agent framework with A2A Protocol
- x402 payment standard (cross-chain & native)
- HCS messaging infrastructure
- HCS-10 OpenConvAI integration
- Production SDK package (`hedron-agent-sdk`)
- 8 production-ready demos

### Phase 2: Real-World Integration (Q1 2025)

**Target Markets:**
- **E-Commerce Platforms** - Integrate SDK for autonomous payment processing
- **B2B Marketplaces** - Deploy supply chain automation
- **Freelancer Platforms** - Automated payout systems
- **SaaS Companies** - Multi-chain subscription billing

**Technical Expansion:**
- Mainnet deployment
- Additional EVM chains (Polygon, Arbitrum, Optimism)
- Enterprise APIs and webhooks
- HCS-10 agent registry integration
- SDK performance optimizations

### Phase 3: Scale (Q2-Q3 2025)

**Market Expansion:**
- **Financial Services** - RWA tokenization platforms
- **NFT Marketplaces** - Royalty distribution networks
- **Supply Chain Finance** - Invoice factoring marketplaces
- **Enterprise Automation** - Large-scale workflow systems

**Platform Growth:**
- HCS-10 network expansion
- SDK marketplace with pre-built templates
- Community contributions and plugins
- Framework integrations (React, Next.js, Express)
- Governance tokens and DAO

### Phase 4: Ecosystem (Q4 2025+)
- **Agent Marketplace** - Discover and connect agents
- **Template Library** - Pre-built workflows (invoice, royalty, supply chain)
- **Analytics Dashboard** - Monitor agent performance
- **Multi-Network Support** - Expand beyond Hedera/EVM
- **Enterprise Support** - SLA guarantees, dedicated support

---

## ⚡ Quick Start (Development)

### Installation

```bash
# Clone repository
git clone https://github.com/Hebx/hedron.git
cd hedron

# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env with your credentials

# Setup HCS-11 profile
npm run setup:hcs11-fixed
```

### Configuration

Configure your `.env` file with:

- Hedera testnet account ID and private key
- Base Sepolia wallet with USDC
- Agent credentials (auto-generated)
- Payment network preference

See [Environment Setup](./docs/HCS11_SETUP_GUIDE.md) for detailed instructions.

---

## 🧪 Testing

### Run All Tests

```bash
npm run test:all  # Unit + Integration + E2E tests
```

### Test Coverage

- **Unit Tests**: Agent logic, protocol implementations
- **Integration Tests**: Cross-protocol workflows, payment flows
- **E2E Tests**: Complete agent coordination (requires HCS-11 setup)

**Status:** ✅ All tests passing

---

## 🌍 Network Support

### Hedera Networks

- **Testnet**: Primary development environment
- **Mainnet**: Production deployments

### EVM Networks

- **Base Sepolia**: Primary settlement network for USDC
- **Ethereum Sepolia**: Alternative network
- **Any EVM**: Compatible with any EVM-compatible chain

---

## 🔧 Development

### Build

```bash
npm run build  # Build SDK and source code
```

### Deploy Contracts

```bash
npm run deploy:simple        # Simple supply chain
npm run deploy:supply-chain  # Advanced supply chain
```

### Check Status

```bash
npm run check:credentials    # Verify configuration
npm run check:wallets        # Check wallet status
```

---

## 📚 Documentation

### SDK Documentation

- **[SDK README](./SDK_README.md)** - SDK installation and usage
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Usage Guide](./docs/USAGE_GUIDE.md)** - How to use Hedron

### Bounty Submissions

- [Bounty 1: Hedera x402 Payment Standard](./docs/BOUNTY_1_HEDERA_X402_STANDARD.md) - Cross-chain payment protocol
- [Bounty 2: Hedera Agent Kit](./docs/BOUNTY_2_HEDERA_AGENT_KIT.md) - Autonomous agent systems
- [Bounties Comparison](./docs/BOUNTIES_GUIDE.md) - Side-by-side comparison

### Core Documentation

- [Complete Documentation Index](./docs/INDEX.md) - All available documentation
- [A2A Protocol Implementation](./docs/A2A_PROTOCOL_IMPLEMENTATION.md) - Agent communication
- [Human-in-the-Loop Mode](./docs/HUMAN_IN_THE_LOOP.md) - HITL configuration
- [Smart Contract Deployment](./docs/SMART_CONTRACT_DEPLOYMENT.md) - Contract deployment

### Setup Guides

- [HCS-11 Setup Guide](./docs/HCS11_SETUP_GUIDE.md) - Profile registration
- [Local HCS Resolver](./docs/LOCAL_HCS_RESOLVER.md) - Local profile resolver
- [Hackathon Ready](./docs/HACKATHON_READY.md) - Submission checklist

### Real-World Applications

- **[Real-World Use Cases](./docs/REAL_WORLD_USE_CASES.md)** - Production implementation examples with code

---

## 📦 Project Structure

```
hedron/
├── src/
│   ├── agents/              # Agent implementations (SDK)
│   ├── protocols/           # A2A, AP2, x402 protocols (SDK)
│   ├── facilitator/         # x402 facilitator server (SDK)
│   ├── modes/              # Human-in-the-loop (SDK)
│   ├── services/           # Token services (SDK)
│   └── utils/              # Utility functions (SDK)
├── contracts/              # Solidity smart contracts
├── tests/                  # Test suite (unit, integration, e2e)
├── demo/                   # Showcase demos
├── docs/                   # Complete documentation
├── dist/                   # Built SDK files
├── SDK_README.md          # SDK-specific documentation
├── HACKATHON_README.md    # Hackathon submission details
└── README.md              # This file
```

---

## 🚀 Key Features

### ✅ Multi-Protocol Support

- A2A for standardized communication
- AP2 for payment negotiations
- x402 for autonomous settlements
- HCS for decentralized messaging

### ✅ Intelligent Agents

- AI-powered decision making
- Fraud detection algorithms
- Risk assessment
- Business rule validation

### ✅ Cross-Chain Capabilities

- USDC on Base/Ethereum
- HBAR on Hedera
- Automatic network selection
- Seamless bridging

### ✅ Production Ready

- Error handling
- Human-in-the-loop (HITL)
- Complete audit trails
- Security best practices

### ✅ SDK Ready

- npm package available
- TypeScript definitions
- Modular exports
- Optional environment configuration

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines in the documentation.

---

## 📄 License

ISC License - see LICENSE file for details.

---

## 🔗 Links

- **GitHub Repository**: [github.com/Hebx/hedron](https://github.com/Hebx/hedron)
- **Issues**: [GitHub Issues](https://github.com/Hebx/hedron/issues)
- **Documentation**: See `docs/` directory
- **SDK Package**: `hedron-agent-sdk` on npm

---

## 🏆 Built For

- **Hedera x402 Payment Standard Bounty** - Agentic Cross-chain payment protocol
- **Hedera Agent Kit Bounty** - Autonomous agent systems and protocols
- **Hedera Africa Hackathon** - Complete submission with both bounties

---

**Hedron** - _Autonomous agents, intelligent decisions, seamless settlements._
