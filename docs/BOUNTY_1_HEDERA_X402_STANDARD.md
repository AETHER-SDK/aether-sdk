# Bounty 1: Hedera x402 Payment Standard

## Overview

Implementation of the x402 payment protocol standard for autonomous agent-to-agent payments. Supports **two modes**:

- **Mode 1:** USDC payments on Base Sepolia (EVM network)
- **Mode 2:** HBAR payments on Hedera (direct Hedera transfers)

---

## What is x402?

The x402 payment protocol is a blockchain-agnostic standard that enables autonomous agents to request, verify, and settle payments. It provides:

- **Payment Requests**: Agents can request specific payment amounts
- **Verification**: Payments are verified before execution
- **Settlement**: Cross-chain token transfers with receipt generation

---

## Implementation Components

### 1. SettlementAgent

The agent responsible for executing x402 payments.

**Location:** `src/agents/SettlementAgent.ts`

**Key Methods:**

- `triggerSettlement()` - Initiates the full x402 payment flow
- `executeSettlement()` - Executes the actual payment
- `verifyPayment()` - Verifies payment requirements
- `settlePayment()` - Final settlement with facilitator

### 2. X402FacilitatorServer

Local facilitator server for payment verification and settlement.

**Location:** `src/facilitator/X402FacilitatorServer.ts`

**Features:**

- Payment verification
- Settlement execution
- Cross-chain transfers (Hedera HBAR and EVM USDC)

### 3. Payment Flow

```
1. Payment Request → 2. Verification → 3. Settlement → 4. Receipt
```

---

## Architecture

### Payment Authorization

```typescript
interface PaymentAuthorization {
  from: string; // Payer address
  to: string; // Recipient address
  value: string; // Amount in atomic units
  validAfter: number; // Timestamp (valid from)
  validBefore: number; // Timestamp (expires)
  nonce: string; // Unique nonce
}

interface PaymentPayload {
  signature: string;
  authorization: PaymentAuthorization;
}
```

### Payment Request (x402 Header)

```typescript
{
  scheme: "exact",
  network: "base-sepolia",
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract
  payTo: "0x...",
  maxAmountRequired: "1000000",
  resource: "/agent-settlement",
  description: "Agent payment",
  mimeType: "application/json"
}
```

### Verification and Settlement

The facilitator server:

1. Verifies payment requirements
2. Checks signatures
3. Executes cross-chain settlement
4. Returns transaction hash

---

## Demos

### Demo 1: Main Orchestrator

**Run:**

```bash
npm run demo
```

**What it does:**

- Analyzes account balance
- Verifies payment threshold
- Executes x402 payment via SettlementAgent
- Records settlement on blockchain

**Output:**

```
✅ Account meets threshold → Executing x402 payment
✅ Payment verified via facilitator
✅ USDC transferred on Base Sepolia
✅ Transaction hash: 0x...
```

### Demo 2: Invoice Automation

**Run:**

```bash
npm run demo:invoice
```

**What it does:**

- Processes invoice data
- Validates payment rules
- Executes x402 USDC payment
- Records payment settlement

**Output:**

```
✅ Invoice processed
✅ x402 payment executed: $150 USDC
✅ Settlement recorded
```

### Demo 3: Supply Chain Negotiation

**Run:**

```bash
USE_X402_PAYMENT=true npm run demo:negotiation
```

**What it does:**

- Multi-agent negotiation
- Agreement reached
- x402 payment for negotiated price
- Cross-chain settlement

**Output:**

```
✅ Negotiation complete
✅ Final price: $95/unit × 1000 = $95,000
✅ x402 payment executed
✅ USDC transferred to vendor
```

---

## Code Examples

### Basic x402 Payment

```typescript
import { SettlementAgent } from "./src/agents/SettlementAgent";

const settlement = new SettlementAgent();
await settlement.init();

const verificationResult = {
  type: "verification_result",
  agentId: "payment-agent",
  proposalId: "payment-123",
  approved: true,
  reasoning: "Payment approved",
  paymentDetails: {
    amount: "1000000", // 1 USDC (atomic units)
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC
    payTo: "0xb36faaA498D6E40Ee030fF651330aefD1b8D24D2", // Recipient
  },
};

// Execute x402 payment
await settlement.triggerSettlement(verificationResult);
```

### Using Local Facilitator

```typescript
import { X402FacilitatorServer } from "./src/facilitator/X402FacilitatorServer";

const facilitator = new X402FacilitatorServer();

// Verify payment
const verification = await facilitator.verify(paymentHeader, requirements);

if (verification.isValid) {
  // Settle payment
  const settlement = await facilitator.settle(paymentHeader, requirements);

  console.log("Payment settled:", settlement.txHash);
}
```

---

## Supported Networks (Two Modes)

### Mode 1: USDC on Base Sepolia (Cross-Chain)

**Purpose:** Cross-chain payments with EVM compatibility  
**Asset:** USDC token  
**Network:** base-sepolia  
**Contract:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`  
**RPC:** `https://sepolia.base.org`

**Use cases:**

- Cross-chain settlements
- EVM ecosystem compatibility
- Token-based payments

### Mode 2: HBAR on Hedera (Direct Hedera)

**Purpose:** Native Hedera payments  
**Asset:** HBAR (native currency)  
**Network:** hedera-testnet  
**Transfer:** Native HBAR transfers

**Use cases:**

- Fast Hedera-native payments
- Lower fees
- Direct Hedera settlements

---

## Tests

### Integration Tests

```bash
# Complete x402 system test
npm run test:complete

# x402 payment server test
npm run test:server

# Improved x402 implementation
npm run test:improved

# x402 utilities test
npm run test:utils
```

### Running All x402 Tests

```bash
npm run test:integration
```

**Test Coverage:**

- ✅ Payment verification
- ✅ Settlement execution
- ✅ Cross-chain transfers
- ✅ Facilitation server
- ✅ Error handling

---

## Features

### ✅ Implemented

1. **Payment Standard Compliance**
   - x402 header format
   - Payment authorization schema
   - Signature verification

2. **Cross-Chain Support**
   - Hedera HBAR transfers
   - EVM USDC transfers
   - Network switching

3. **Local Facilitator**
   - Payment verification
   - Settlement execution
   - No external dependencies

4. **Agent Integration**
   - SettlementAgent class
   - Automatic payment execution
   - Receipt generation

### 🔄 In Progress

1. **Enhanced Error Handling**
   - Retry logic
   - Fallback mechanisms
   - Better error messages

2. **Monitoring**
   - Payment status tracking
   - Transaction history
   - Analytics dashboard

---

## Configuration

### Environment Variables

```bash
# Base Sepolia Configuration
RPC_URL=https://sepolia.base.org
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Payment Addresses
MERCHANT_WALLET_ADDRESS=0xb36faaA498D6E40Ee030fF651330aefD1b8D24D2
SETTLEMENT_WALLET_PRIVATE_KEY=0x...

# Network Selection
PAYMENT_NETWORK=base-sepolia  # or hedera-testnet
```

---

## File Structure

```
src/
├── agents/
│   └── SettlementAgent.ts          # x402 payment agent
├── facilitator/
│   └── X402FacilitatorServer.ts    # Local facilitator
└── protocols/
    └── x402Protocol.ts              # x402 utilities

tests/
└── integration/
    ├── test-complete-x402-system.ts
    ├── test-payment-server.ts
    └── test-improved-x402.ts

demo/
├── orchestrator.ts                  # Main demo
└── invoice-automation-demo.ts      # Invoice demo
```

---

## API Reference

### SettlementAgent

```typescript
class SettlementAgent {
  async init(): Promise<void>;
  async triggerSettlement(result: VerificationResult): Promise<void>;
  async executeSettlement(details: PaymentDetails): Promise<string>;
  async verifyPayment(payment: PaymentPayload): Promise<boolean>;
}
```

### X402FacilitatorServer

```typescript
class X402FacilitatorServer {
  async verify(header: string, req: Requirements): Promise<VerificationResult>;
  async settle(header: string, req: Requirements): Promise<SettlementResult>;
}
```

---

## Summary

This implementation provides a complete x402 payment system with:

✅ Full protocol compliance  
✅ Cross-chain support (Hedera + EVM)  
✅ Local facilitator server  
✅ Agent integration  
✅ Comprehensive tests  
✅ Production-ready demos

**Ready for bounty submission!** 🎉
