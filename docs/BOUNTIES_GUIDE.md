# Hedron Bounties Guide

Complete guide for both Hedera hackathon bounties: x402 Payment Standard and Hedera Agent Kit.

---

## 🎯 Two Bounties Overview

### Bounty 1: Hedera x402 Payment Standard SDK

**Focus:** Cross-chain autonomous payment protocol

**Two Modes:**

- **Mode 1:** USDC on Base Sepolia (cross-chain settlements)
- **Mode 2:** HBAR on Hedera (native Hedera payments)

**Technology:** x402 payment standard, local facilitator

---

### Bounty 2: Hedera Agent Kit (A2A Protocol)

**Focus:** Autonomous agent-to-agent systems

**Two Key Features:**

- **Feature 1:** LLM reasoning for intelligent decisions
- **Feature 2:** Hedera token settlement with fraud detection

**Technology:** A2A protocol, LLM integration, HCS messaging

---

## 📊 Detailed Comparison

| Aspect              | Bounty 1: x402                      | Bounty 2: Agent Kit              |
| ------------------- | ----------------------------------- | -------------------------------- |
| **Primary Purpose** | Payment protocol standard           | Agent-to-agent systems           |
| **Mode/Feature 1**  | USDC on Base Sepolia                | LLM reasoning                    |
| **Mode/Feature 2**  | HBAR on Hedera                      | Hedera token settlement          |
| **Networks**        | Base Sepolia + Hedera               | Hedera (primary)                 |
| **Assets**          | USDC, HBAR                          | HBAR, Hedera tokens              |
| **Key Innovation**  | Cross-chain x402 standard           | AI-powered autonomous agents     |
| **Technology**      | x402 protocol                       | A2A + LLM + Hedera               |
| **Use Cases**       | NFT royalties, cross-chain payments | Invoice automation, supply chain |

---

## 🚀 Bounty 1: x402 Payment Standard

### Cross-Chain x402 (USDC on Base)

**What it does:**

- Enables autonomous cross-chain payments
- USDC settlement on Base Sepolia
- Works with any EVM-compatible network
- Fast, low-cost transactions

**Demos:**

- `npm run demo:nft-royalty 150` - NFT royalty settlement
- `npm run demo` - Complete orchestrator with x402

### Native x402 (HBAR on Hedera)

**What it does:**

- Native Hedera payments
- HBAR transfers
- Fast finality (2-3 seconds)
- Lower fees

**Demos:**

- `npm run demo:hbar-x402 10` - Direct HBAR settlement

**Read More:** [x402 Payment Standard Guide](./BOUNTY_1_HEDERA_X402_STANDARD.md)

---

## 🤖 Bounty 2: Hedera Agent Kit

### LLM Reasoning

**What it does:**

- AI analyzes invoice context
- Intelligent approval/rejection reasoning
- Fraud detection capabilities
- Autonomous decision making

**Demos:**

- `npm run demo:invoice-llm` - LLM-powered invoice validation

### Hedera Token Settlement

**What it does:**

- Native Hedera HBAR settlements
- Fraud detection algorithms
- Memo verification on blockchain
- Multi-agent negotiation

**Demos:**

- `npm run demo:supply-chain-fraud` - Fraud detection + settlement

**Read More:** [Agent Kit Guide](./BOUNTY_2_HEDERA_AGENT_KIT.md)

---

## 🎬 Complete Demo Suite

### 4 Core Showcase Demos

**Bounty 1 (x402):**

1. `npm run demo:nft-royalty 150` - Cross-chain NFT royalties
2. `npm run demo:hbar-x402 10` - Native HBAR payments

**Bounty 2 (Agent Kit):** 3. `npm run demo:invoice-llm` - LLM reasoning 4. `npm run demo:supply-chain-fraud` - Fraud + Memo verification

### Supporting Demos

- `npm run demo` - Main orchestrator
- `npm run demo:invoice` - Invoice automation
- `npm run demo:negotiation` - Supply chain negotiation

See [Demo Guide](./demo/README.md) for complete details.

---

## 🔧 Configuration

### For Bounty 1 (x402)

```bash
# Cross-chain USDC on Base Sepolia
PAYMENT_NETWORK=base-sepolia
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Or native HBAR on Hedera
PAYMENT_NETWORK=hedera-testnet
```

### For Bounty 2 (Agent Kit)

```bash
# LLM Reasoning (optional)
OPENAI_API_KEY=sk-...

# Hedera token settlement
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HITL_PAYMENT_THRESHOLD=500
```

See [Usage Guide](./USAGE_GUIDE.md) for complete configuration.

---

## 📖 Learn More

- [Bounty 1 Guide](./BOUNTY_1_HEDERA_X402_STANDARD.md) - Complete x402 implementation
- [Bounty 2 Guide](./BOUNTY_2_HEDERA_AGENT_KIT.md) - Complete agent kit
- [Usage Guide](./USAGE_GUIDE.md) - How to use Hedron
- [API Reference](./API_REFERENCE.md) - Complete API docs

---

## ✅ Status

Both bounties are complete and ready for submission! 🎉

- ✅ All tests passing
- ✅ All demos working
- ✅ Complete documentation
- ✅ Production-ready code

---

**Ready to explore?** Check out the [demo guide](./demo/README.md) to see Hedron in action.
