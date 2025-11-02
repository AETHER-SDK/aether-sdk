# Aether

**Autonomous Agent Ecosystem SDK for Solana with x402 Payment Protocol**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-green.svg)](https://solana.com)
[![x402](https://img.shields.io/badge/x402-Payment-purple.svg)](https://solana.com/x402/what-is-x402)

Aether is a complete SDK and framework for building autonomous agent-to-agent systems on Solana. It integrates the x402 Payment Protocol to enable truly autonomous, intelligent agent communication and micropayment settlement.

Built for the **x402 Solana Hackathon** - redefining the autonomous agent economy.

---

## 🌟 Vision

**Aether** envisions a future where autonomous AI agents orchestrate complex workflows on Solana—negotiating contracts, processing micropayments, detecting fraud, and making intelligent decisions—all without human intervention.

Our ecosystem integrates:

- **x402 Protocol** - HTTP 402 payment standard for autonomous API payments
- **Solana** - High-speed, low-cost blockchain for agent transactions
- **A2A Protocol** - Standardized agent-to-agent communication
- **USDC on Solana** - Stable, predictable pricing for agent services

---

## 🎯 What Is Aether?

Aether is both a **production-ready SDK** and a **complete framework** that enables:

### 🔄 Autonomous Workflows

- **Agent Negotiation**: Buyers and sellers negotiate terms autonomously
- **Intelligent Verification**: LLM-powered decision making and fraud detection
- **Automated Settlement**: x402-based micropayments executed in milliseconds
- **Zero Human Intervention**: Fully autonomous agent-to-agent transactions

### ⚡ Solana-Native Performance

- **400ms Finality**: Lightning-fast transaction confirmation
- **$0.00025 Transaction Costs**: Micropayments at scale
- **Native USDC**: Stable pricing without volatility
- **SPL Token Support**: Extensible payment token infrastructure

### 🤖 Smart Agents

- **AnalyzerAgent**: Queries blockchain data, generates insights, proposes actions
- **VerifierAgent**: Validates proposals, applies business rules, makes decisions
- **SettlementAgent**: Executes x402 payments, records settlements on-chain
- **IntelligentVerifierAgent**: AI-powered validation with GPT-4 reasoning

---

## 📦 SDK Installation

Aether is available as an npm package for easy integration into your projects.

### Install

```bash
npm install aether-agent-sdk
```

### Quick Start

```typescript
import {
  AnalyzerAgent,
  VerifierAgent,
  SettlementAgent,
  A2AProtocol
} from 'aether-agent-sdk'

const agent = new SettlementAgent()
await agent.init()

const txHash = await agent.executeSolanaTransfer(
  'merchant_wallet_address',
  1.0
)
```

### SDK Documentation

- **[API Reference](./docs/API_REFERENCE.md)** - Full API documentation
- **[Usage Guide](./docs/USAGE_GUIDE.md)** - Integration examples
- **[x402 Integration](./docs/X402_GUIDE.md)** - x402 payment protocol guide

---

## 🎬 Demos & Examples

Aether includes production-ready demos showcasing real-world use cases with actual Solana transactions.

### 💳 x402 Payment Demo

Demonstrates autonomous agent micropayments using the x402 protocol on Solana.

```bash
npm run demo
```

Features:
- Autonomous payment authorization
- x402 facilitator integration
- USDC token transfers on Solana
- Real-time settlement verification

### 🤖 Intelligent Invoice Processing

AI-powered invoice verification and automatic payment settlement.

```bash
npm run demo:invoice-llm
```

### 🔗 Supply Chain Negotiation

Autonomous agents negotiate supply chain terms and settle payments.

```bash
npm run demo:negotiation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- TypeScript 5.9+
- Solana CLI (optional, for key generation)
- Devnet SOL and USDC for testing

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/4n0nn43x/Aether.git
cd Aether
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
AGENT_PRIVATE_KEY=your_base58_private_key
MERCHANT_WALLET_ADDRESS=merchant_wallet
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

4. **Generate a wallet** (if needed)

```bash
solana-keygen new --outfile ~/.config/solana/agent-wallet.json
```

5. **Get devnet SOL and USDC**

```bash
solana airdrop 2 your_wallet_address --url devnet
```

For USDC, use the [Solana Faucet](https://faucet.circle.com/) or Solana Devnet tools.

6. **Build the project**

```bash
npm run build
```

7. **Run a demo**

```bash
npm run demo
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│   SDK Entry Point (src/index.ts)        │
├─────────────────────────────────────────┤
│   Agents Layer (src/agents/)            │
│   ├─ AnalyzerAgent                      │
│   ├─ VerifierAgent                      │
│   ├─ SettlementAgent                    │
│   └─ IntelligentVerifierAgent           │
├─────────────────────────────────────────┤
│   x402 Facilitator (src/facilitator/)   │
│   └─ X402FacilitatorServer              │
├─────────────────────────────────────────┤
│   Protocols Layer (src/protocols/)      │
│   ├─ A2AProtocol                        │
│   ├─ AP2Protocol                        │
│   └─ A2ANegotiation                     │
├─────────────────────────────────────────┤
│   Solana Integration                    │
│   ├─ @solana/web3.js                    │
│   ├─ @solana/spl-token                  │
│   └─ @faremeter/* (x402)                │
└─────────────────────────────────────────┘
```

---

## 🔑 Key Features

### x402 Payment Protocol Integration

- HTTP 402 (Payment Required) status code implementation
- Autonomous payment authorization and verification
- Sub-second settlement finality on Solana
- USDC micropayments with stable pricing

### Agent-to-Agent Communication

- Google A2A Protocol compliance
- Standardized message formats
- Async communication patterns
- Event-driven architecture

### AI-Powered Intelligence

- LangChain integration for LLM reasoning
- GPT-4 and Ollama support
- Intelligent fraud detection
- Autonomous decision-making

### Production-Ready SDK

- TypeScript with full type safety
- Modular exports for tree-shaking
- Comprehensive error handling
- Extensive logging and debugging

---

## 🌐 x402 Hackathon Submission

Aether is built for the **x402 Solana Hackathon**, showcasing:

✅ **x402 Protocol Integration** - Full implementation of x402 payment standard
✅ **Solana Devnet Deployment** - Live transactions on Solana devnet
✅ **Autonomous Agent Economy** - AI agents transacting independently
✅ **USDC Micropayments** - Sub-dollar payments at scale
✅ **Open Source** - MIT licensed, fully documented

### Hackathon Categories

- **Best x402 Infrastructure** - Facilitator implementation for agent payments
- **Best AI Agent Integration** - LLM-powered autonomous decision-making
- **Best Developer Tool** - Comprehensive SDK for agent development

---

## 📚 Documentation

- [API Reference](./docs/API_REFERENCE.md)
- [Usage Guide](./docs/USAGE_GUIDE.md)
- [x402 Integration Guide](./docs/X402_GUIDE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **GitHub**: [github.com/4n0nn43x/Aether](https://github.com/4n0nn43x/Aether)
- **x402 Documentation**: [solana.com/x402](https://solana.com/x402/what-is-x402)
- **Solana Developers**: [solana.com/developers](https://solana.com/developers)

---

## 🙏 Acknowledgments

Built for the x402 Solana Hackathon with support from:
- Solana Foundation
- Coinbase Dev
- Phantom Wallet
- Crossmint
- The entire Solana developer community

---

**Aether** - Redefining the autonomous agent economy on Solana.
