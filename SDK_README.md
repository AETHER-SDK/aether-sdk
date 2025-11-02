# Hedron Agent SDK

**Autonomous Agent Ecosystem SDK for Hedera Hashgraph**

Hedron is a complete SDK for building autonomous agent-to-agent systems on the Hedera network. It provides A2A Protocol implementation, x402 Payment Standard, and multi-protocol agent communication capabilities.

---

## 🚀 Installation

```bash
npm install hedron-agent-sdk
```

---

## 📦 Quick Start

### Basic Import

```typescript
import { 
  AnalyzerAgent, 
  VerifierAgent, 
  SettlementAgent,
  A2AProtocol,
  HumanInTheLoopMode 
} from 'hedron-agent-sdk'
```

### Initialize an Agent

```typescript
import { AnalyzerAgent } from 'hedron-agent-sdk'

// Configure environment variables or pass via constructor
process.env.ANALYZER_AGENT_ID = '0.0.123456'
process.env.ANALYZER_PRIVATE_KEY = 'your-private-key'
process.env.HEDERA_ACCOUNT_ID = '0.0.123456'
process.env.HEDERA_PRIVATE_KEY = 'your-main-key'

const agent = new AnalyzerAgent()
await agent.init()

// Query account data
const accountInfo = await agent.queryAccount('0.0.123456')
```

### Use A2A Protocol

```typescript
import { A2AProtocol } from 'hedron-agent-sdk'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'

const hcsClient = new HCS10Client(agentId, privateKey, 'testnet')
const a2a = new A2AProtocol(hcsClient, agentId, ['payment', 'settlement'])

// Send A2A message
await a2a.sendMessage(
  topicId,
  receiverAgentId,
  'request',
  { type: 'payment_request', amount: '1000000' }
)
```

### Cross-Chain Payments (x402)

```typescript
import { SettlementAgent } from 'hedron-agent-sdk'

const settlement = new SettlementAgent()
await settlement.init()

// Payment will be executed automatically via x402 protocol
// Supports both Hedera (HBAR) and EVM chains (USDC)
```

---

## 📚 Module Exports

### Agents

```typescript
import {
  AnalyzerAgent,
  VerifierAgent,
  SettlementAgent,
  SettlementAgentEnhanced,
  IntelligentVerifierAgent,
  AgentRegistry
} from 'hedron-agent-sdk'
```

Or import from submodule:

```typescript
import { AnalyzerAgent } from 'hedron-agent-sdk/agents'
```

### Protocols

```typescript
import {
  A2AProtocol,
  AP2Protocol,
  A2ANegotiation,
  HCS10ConnectionManager,
  HCS10TransactionApproval
} from 'hedron-agent-sdk'
```

Or import from submodule:

```typescript
import { A2AProtocol } from 'hedron-agent-sdk/protocols'
```

### Services

```typescript
import {
  TokenService,
  createRoyaltyTokenForNFTs
} from 'hedron-agent-sdk'
```

Or import from submodule:

```typescript
import { TokenService } from 'hedron-agent-sdk/services'
```

### Modes

```typescript
import {
  HumanInTheLoopMode
} from 'hedron-agent-sdk'
```

Or import from submodule:

```typescript
import { HumanInTheLoopMode } from 'hedron-agent-sdk/modes'
```

---

## 🎯 Use Cases

### 1. Invoice Automation

```typescript
import { IntelligentVerifierAgent, SettlementAgent } from 'hedron-agent-sdk'

const verifier = new IntelligentVerifierAgent()
const settlement = new SettlementAgent()

// AI validates invoice
const validation = await verifier.validateInvoice(invoiceData)

// Auto-settle if approved
if (validation.approved) {
  await settlement.executePayment({
    amount: invoiceData.amount,
    network: 'base-sepolia',
    asset: 'USDC'
  })
}
```

### 2. Supply Chain Negotiation

```typescript
import { A2ANegotiation } from 'hedron-agent-sdk'

const negotiation = new A2ANegotiation(a2aProtocol)
const agreement = await negotiation.negotiate(
  buyerAgentId,
  vendorAgentId,
  { price: 10000, quantity: 100 }
)

// Record agreement on Hedera HCS
await negotiation.recordAgreement(agreement)
```

### 3. Human-in-the-Loop Approval

```typescript
import { HumanInTheLoopMode } from 'hedron-agent-sdk'

const hitl = new HumanInTheLoopMode({
  threshold: 1000, // Require approval for payments > $1000
  enabled: true
})

const approved = await hitl.requestApproval({
  type: 'payment',
  amount: 1500,
  details: 'Large vendor payment'
})

if (approved) {
  // Proceed with payment
}
```

---

## ⚙️ Configuration

### Environment Variables

The SDK supports environment variables for configuration:

```bash
# Hedera Network
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e0201...

# Agent Credentials
ANALYZER_AGENT_ID=0.0.XXXXXX
ANALYZER_PRIVATE_KEY=...
VERIFIER_AGENT_ID=0.0.XXXXXX
VERIFIER_PRIVATE_KEY=...
SETTLEMENT_AGENT_ID=0.0.XXXXXX
SETTLEMENT_PRIVATE_KEY=...

# Payment Configuration
PAYMENT_NETWORK=base-sepolia  # or 'hedera-testnet'
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_RPC_URL=https://sepolia.base.org

# AI Integration (Optional)
OPENAI_API_KEY=sk-...
```

**Note:** The SDK makes dotenv optional. You can provide environment variables via:
- `.env` file (if dotenv is available)
- `process.env` directly
- Configuration objects (future feature)

---

## 📖 Documentation

- [Complete API Reference](./docs/API_REFERENCE.md)
- [Usage Guide](./docs/USAGE_GUIDE.md)
- [A2A Protocol Implementation](./docs/A2A_PROTOCOL_IMPLEMENTATION.md)
- [x402 Payment Standard](./docs/BOUNTY_1_HEDERA_X402_STANDARD.md)

---

## 🤝 Contributing

Contributions are welcome! Please see our contributing guidelines.

---

## 📄 License

ISC License

---

## 🔗 Links

- **GitHub**: [github.com/Hebx/hedera-a2a-agents](https://github.com/Hebx/hedera-a2a-agents)
- **Documentation**: See `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/Hebx/hedera-a2a-agents/issues)

---

**Hedron** - _Autonomous agents, intelligent decisions, seamless settlements._

