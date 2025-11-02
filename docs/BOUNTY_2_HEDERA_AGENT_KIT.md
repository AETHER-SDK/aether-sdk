# Bounty 2: Hedera Agent Kit (A2A Protocol)

## Overview

Implementation of autonomous agent-to-agent systems using Google's A2A Protocol for Hedera networks, with complete invoicing and supply chain negotiation use cases.

---

## What is the Agent Kit?

The Hedera Agent Kit enables autonomous agent-to-agent communication using:

- **Google A2A Protocol** - Standard agent communication
- **Hedera Consensus Service (HCS)** - Decentralized messaging
- **Multi-Agent Systems** - Multiple agents working together
- **LLM Reasoning** - AI-powered decision making
- **Hedera Token Settlement** - Native Hedera payments (HBAR/tokens)

---

## Agent Architecture

### Three Core Agents

#### 1. AnalyzerAgent

**Role:** Data analysis and insights  
**Location:** `src/agents/AnalyzerAgent.ts`

**Capabilities:**

- Query account balances
- Analyze account data
- Generate insights
- Propose actions based on data

**Example:**

```typescript
const analyzer = new AnalyzerAgent();
await analyzer.init();

const accountData = await analyzer.queryAccount("0.0.123456");
// Returns: { accountId, balance, key, ... }
```

#### 2. VerifierAgent

**Role:** Validation and approval  
**Location:** `src/agents/VerifierAgent.ts`

**Capabilities:**

- Verify proposals
- Approve or reject actions
- Apply business rules
- Provide reasoning

**Example:**

```typescript
const verifier = new VerifierAgent();
await verifier.init();

const approval = await verifier.processProposal({
  type: "payment",
  amount: 100,
  threshold: 50,
});
```

#### 3. SettlementAgent

**Role:** Payment execution  
**Location:** `src/agents/SettlementAgent.ts`

**Capabilities:**

- Execute x402 payments
- Process settlements
- Record transactions
- Generate receipts

**Example:**

```typescript
const settlement = new SettlementAgent();
await settlement.init();

await settlement.triggerSettlement({
  approved: true,
  paymentDetails: { amount: "1000000", payTo: "0x..." },
});
```

---

## Use Case 1: Invoice Automation

### Description

Automated invoice processing where agents autonomously:

1. Read and parse invoices
2. Validate invoice data
3. Approve payments
4. Execute settlement via x402

### Demo

**Run:**

```bash
npm run demo:invoice
```

**What Happens:**

```
📄 Phase 1: Invoice Detection
  ✅ Invoice identified
  📋 Amount: $150
  📋 Vendor: 0.0.XXXXXX
  📋 Due Date: 30 days

🔍 Phase 2: Validation
  ✅ Invoice validated
  ✅ Business rules checked
  ✅ Payment approved

💰 Phase 3: Payment Execution
  ✅ Hedera token settlement initiated
  ✅ HBAR transfer on Hedera Testnet
  ✅ Transaction confirmed

📝 Phase 4: Settlement Recorded
  ✅ Payment receipt saved
  ✅ Audit trail created
```

### Implementation

**File:** `demo/invoice-automation-demo.ts`

**Key Features:**

- Real invoice data (no mocks)
- HITL for high-value invoices
- x402 payment integration
- Blockchain settlement

**Code:**

```typescript
// Create invoice
const invoice = {
  invoiceId: "INV-123",
  vendorAccountId: "0.0.XXXXXX",
  amountUSD: 150,
  description: "Software License",
  dueDate: new Date(),
};

// Process through agents
await analyzer.validateInvoice(invoice);
await verifier.approveInvoice(invoice);
await settlement.triggerSettlement(verificationResult);
```

---

## Use Case 2: Supply Chain Negotiation

### Description

Multi-agent price and terms negotiation where:

1. Buyer agent proposes initial terms
2. Vendor agent makes counter-offers
3. Both agents negotiate autonomously
4. Agreement reached with x402 settlement

### Demo

**Run:**

```bash
npm run demo:negotiation
```

**What Happens:**

```
🤝 Round 1: Initial Proposal
  👤 Buyer: $85/unit × 1000 = $85,000
  🏭 Vendor: $95/unit × 1000 = $95,000

🤝 Round 2: Counter-Offer
  👤 Buyer: $88/unit (counter-offer)
  🏭 Vendor: $92/unit (counter-offer)

🤝 Round 3: Final Agreement
  ✅ Both agree: $90/unit
  ✅ Terms: Net 30 payment
  ✅ Warranty: 12 months

💸 Settlement
  ✅ Agreement recorded on blockchain
  ✅ Hedera token settlement executed
  ✅ $90,000 in HBAR transferred
```

### Implementation

**File:** `demo/supply-chain-negotiation-demo.ts`

**Key Features:**

- Autonomous negotiation logic
- Multiple negotiation rounds
- Agreement verification
- x402 payment settlement

**Code:**

```typescript
// Negotiation between agents
const buyerAgent = new NegotiationAgent("buyer");
const vendorAgent = new NegotiationAgent("vendor");

// Autonomous negotiation
const agreement = await negotiateTerms({
  initialPrice: 85,
  quantity: 1000,
  maxPrice: 95,
});

// Settlement after agreement
await settlement.triggerSettlement({
  amount: agreement.finalPrice * agreement.quantity,
  approved: true,
});
```

---

## Agent Communication (HCS-10)

### How Agents Communicate

Agents use Hedera Consensus Service topics for messaging:

```typescript
// Agent sends message
await hcsClient.sendMessage(
  topicId,
  JSON.stringify({
    type: "analysis_proposal",
    accountId: "0.0.123456",
    balance: "100 HBAR",
    proposal: "Execute payment",
  })
);

// Other agent receives message
await hcsClient.subscribe(topicId, (message) => {
  const data = JSON.parse(message);
  // Process message
});
```

### Topic Structure

```
Topic: 0.0.7132818 (VerifierAgent)
  ↓ Messages
Topic: 0.0.7132822 (SettlementAgent)
```

---

## Human-in-the-Loop (HITL)

### When Human Approval is Required

For high-value or critical decisions:

```typescript
const hitl = new HumanInTheLoopMode({
  enabled: true,
  approvalThresholds: {
    payment: 500, // $500 requires approval
  },
});

// Check if approval needed
if (hitl.requiresApproval("payment", { amount: 600 })) {
  // Pause and wait for human
  await hitl.requestApproval();
}
```

### HITL Integration

**Configure in `.env`:**

```bash
HITL_PAYMENT_THRESHOLD=500  # $500 default
HITL_ENABLED=true
```

---

## Complete Agent Workflow

### 1. Agent Initialization

```typescript
// Initialize all agents
const analyzer = new AnalyzerAgent();
const verifier = new VerifierAgent();
const settlement = new SettlementAgent();

await analyzer.init();
await verifier.init();
await settlement.init();
```

### 2. Workflow Execution

```typescript
// Step 1: Analysis
const accountData = await analyzer.queryAccount("0.0.123456");
const proposal = await analyzer.propose(accountData);

// Step 2: Verification
const verificationResult = await verifier.verify(proposal);

// Step 3: Settlement
if (verificationResult.approved) {
  await settlement.triggerSettlement(verificationResult);
}
```

### 3. HCS Communication

```typescript
// Send proposal via HCS
await hcsClient.sendMessage(topicId, JSON.stringify(proposal));

// Listen for responses
await hcsClient.subscribe(topicId, (message) => {
  const response = JSON.parse(message);
  handleResponse(response);
});
```

---

## API Reference

### AnalyzerAgent

```typescript
class AnalyzerAgent {
  async init(): Promise<void>;
  async queryAccount(accountId: string): Promise<AccountData>;
  async propose(insight: DataInsight): Promise<Proposal>;
}
```

### VerifierAgent

```typescript
class VerifierAgent {
  async init(): Promise<void>;
  async processProposal(proposal: Proposal): Promise<VerificationResult>;
  async verify(proposal: Proposal): Promise<boolean>;
}
```

### SettlementAgent

```typescript
class SettlementAgent {
  async init(): Promise<void>;
  async triggerSettlement(result: VerificationResult): Promise<void>;
  async executeSettlement(details: PaymentDetails): Promise<string>;
}
```

---

## Demos

### Main Orchestrator

```bash
npm run demo
```

Complete 3-agent workflow

### Invoice Automation

```bash
npm run demo:invoice
```

Invoice processing with x402 payment

### Supply Chain

```bash
npm run demo:negotiation
```

Multi-agent negotiation and settlement

### Intelligent Invoice (LLM-Powered)

```bash
npm run demo:invoice-llm
```

**Features:**

- LLM reasoning for invoice validation
- AI-powered decision making
- Hedera token settlement (HBAR)
- Autonomous processing with AI insights

---

## Configuration

### Environment Setup

```bash
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e0201...

# Agent IDs
ANALYZER_AGENT_ID=0.0.7132811
VERIFIER_AGENT_ID=0.0.7132816
SETTLEMENT_AGENT_ID=0.0.7132819

# Topic IDs
MAIN_TOPIC_ID=0.0.7132813
VERIFIER_TOPIC_ID=0.0.7132818
SETTLEMENT_TOPIC_ID=0.0.7132822

# HITL Configuration
HITL_PAYMENT_THRESHOLD=500
HITL_ENABLED=true
```

---

## File Structure

```
src/
├── agents/
│   ├── AnalyzerAgent.ts           # Analysis agent
│   ├── VerifierAgent.ts           # Verification agent
│   └── SettlementAgent.ts         # Settlement agent
├── protocols/
│   └── A2AProtocol.ts              # A2A protocol
├── modes/
│   └── HumanInTheLoopMode.ts      # HITL mode
└── facilitator/
    └── X402FacilitatorServer.ts    # Payment facilitator

demo/
├── orchestrator.ts                 # Main demo
├── invoice-automation-demo.ts      # Use case 1
└── supply-chain-negotiation-demo.ts # Use case 2

tests/
├── unit/                           # Agent tests
│   ├── test-analyzer.ts
│   ├── test-verifier.ts
│   └── test-settlement.ts
└── e2e/                            # End-to-end tests
    └── test-complete-coordination.ts
```

---

## Summary

This implementation provides:

✅ **Complete Agent Kit**

- AnalyzerAgent, VerifierAgent, SettlementAgent
- A2A protocol communication
- HCS messaging

✅ **Two Use Cases**

- Invoice automation
- Supply chain negotiation

✅ **Integration**

- LLM reasoning (AI decision making)
- Hedera token settlement (HBAR)
- HITL approval system

✅ **Production Ready**

- Comprehensive tests
- Working demos
- Full documentation

**Ready for bounty submission!** 🎉
