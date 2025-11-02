# Demo Suite - Hedera Bounties

## Overview

This directory contains demos for two Hedera bounties and Track 1 alignment:

### Bounty 1: x402 Payment Standard SDK

Two showcase demos for cross-chain payment protocol.

### Bounty 2: Hedera Agent Kit (A2A Protocol)

Two showcase demos for autonomous agent systems.

### Track 1: On-Chain Finance & RWA Tokenization

Tokenized invoice demo demonstrating Real-World Asset tokenization.

---

## 🎯 Bounty 1: x402 Payment Standard

### Demo 1: NFT Royalty Settlement (x402 Cross-Chain)

**File:** `nft-royalty-x402-demo.ts`  
**Command:** `npm run demo:nft-royalty [sale-price]`

**Demonstrates:**

- NFT sale simulation
- Automatic royalty calculation (10%)
- Cross-chain x402 payment
- USDC on Base Sepolia
- Creator royalty payment

**Network:** Base Sepolia  
**Asset:** USDC  
**Protocol:** x402

### Demo 2: Direct HBAR Transfer (x402 Native)

**File:** `hbar-direct-x402-demo.ts`  
**Command:** `npm run demo:hbar-x402 [amount]`

**Demonstrates:**

- Direct Hedera HBAR transfers
- x402 verification on native Hedera
- Fast native settlements
- Low-fee payments

**Network:** Hedera Testnet  
**Asset:** HBAR  
**Protocol:** x402

---

## 🤖 Bounty 2: Hedera Agent Kit

### Demo 3: Invoice with LLM Reasoning

**File:** `intelligent-invoice-demo.ts`  
**Command:** `npm run demo:invoice-llm`

**Demonstrates:**

- LLM-powered invoice validation
- AI decision making
- Intelligent reasoning
- Hedera token settlement (HBAR)

**Technology:** LLM + A2A Protocol  
**Network:** Hedera Testnet  
**Asset:** HBAR

### Demo 4: Supply Chain with Fraud Detection & Memo Verification

**File:** `supply-chain-fraud-detection-demo.ts`  
**Command:** `npm run demo:supply-chain-fraud`

**Demonstrates:**

- Multi-agent negotiation
- AI fraud detection
- Memo verification on blockchain
- Hedera token settlement

**Technology:** Fraud Detection + Memo Verification + A2A  
**Network:** Hedera Testnet  
**Asset:** HBAR

---

## 🏦 Track 1: On-Chain Finance & RWA Tokenization

### Demo 5: Tokenized RWA Invoice

**File:** `tokenized-rwa-invoice-demo.ts`  
**Command:** `npm run demo:rwa-invoice [amount]`

**Demonstrates:**

- Invoice tokenization as Real-World Asset (RWA)
- Hedera Token Service (HTS) token creation
- RWA token trading/transfer (invoice factoring)
- Automated settlement via x402 payment standard
- Cross-chain payment execution

**Technology:** HTS Tokenization + x402 Payment Standard  
**Network:** Hedera Testnet + Base Sepolia  
**Asset:** HTS Tokens + HBAR/USDC

**Use Case:** Invoice factoring market, improved liquidity, fractional ownership

---

## Additional Demos (Supporting)

### Main Orchestrator

**File:** `orchestrator.ts`  
**Command:** `npm run demo`

Complete 3-agent workflow with x402 payments (supports both HBAR and USDC).

### Invoice Automation

**File:** `invoice-automation-demo.ts`  
**Command:** `npm run demo:invoice`

Invoice processing with agents and x402 integration.

### Supply Chain Negotiation

**File:** `supply-chain-negotiation-demo.ts`  
**Command:** `npm run demo:negotiation`

Multi-agent price negotiation with settlement.

---

## Demo Commands Reference

```bash
# Bounty 1: x402 Standard
npm run demo:nft-royalty 150      # NFT royalty (USDC on Base)
npm run demo:hbar-x402 10         # HBAR direct (x402 native)

# Bounty 2: Agent Kit
npm run demo:invoice-llm         # LLM reasoning + Hedera tokens
npm run demo:supply-chain-fraud   # Fraud detection + memo verification

# Track 1: RWA Tokenization
npm run demo:rwa-invoice 250    # Tokenized invoice as RWA

# Supporting demos
npm run demo                      # Main orchestrator
npm run demo:invoice             # Invoice automation
npm run demo:negotiation         # Supply chain negotiation
```

---

## Quick Start

### For x402 (Bounty 1):

```bash
# Show cross-chain x402
npm run demo:nft-royalty 150

# Show native x402
npm run demo:hbar-x402 10
```

### For Agent Kit (Bounty 2):

```bash
# Show LLM reasoning
npm run demo:invoice-llm

# Show fraud detection
npm run demo:supply-chain-fraud
```

### For Track 1 (RWA Tokenization):

```bash
# Show tokenized invoice as RWA
npm run demo:rwa-invoice 250
```

---

## What Each Demo Showcases

| Demo               | Bounty/Track | Mode/Feature     | Network      | Asset |
| ------------------ | ------------ | ---------------- | ------------ | ----- |
| nft-royalty-x402   | Bounty 1      | Cross-chain x402 | Base Sepolia | USDC  |
| hbar-direct-x402   | Bounty 1      | Native x402      | Hedera       | HBAR  |
| invoice-llm        | Bounty 2      | LLM reasoning    | Hedera       | HBAR  |
| supply-chain-fraud | Bounty 2      | Fraud + Memo     | Hedera       | HBAR  |
| tokenized-rwa-invoice | Track 1   | RWA Tokenization | Hedera + Base | HTS + HBAR/USDC |

---

## Environment Setup

```bash
# Required
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e0201...

# For x402 USDC
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
MERCHANT_WALLET_ADDRESS=0x...
SETTLEMENT_WALLET_PRIVATE_KEY=0x...

# For Agent Kit LLM
OPENAI_API_KEY=sk-...  # Optional
HEDERA_MERCHANT_ACCOUNT_ID=0.0.XXXXXX
```

---

## Summary

**5 Key Showcase Demos:**

- ✅ NFT Royalty (x402 cross-chain)
- ✅ HBAR Direct (x402 native)
- ✅ Invoice LLM (AI reasoning)
- ✅ Supply Chain Fraud (Security + Verification)
- ✅ Tokenized RWA Invoice (RWA Tokenization)

**All ready for hackathon showcase! 🏆**
