# API Reference - Hedron Agent System

Complete API documentation for all agents and their methods.

## Table of Contents

1. [AnalyzerAgent](#analyzeragent)
2. [VerifierAgent](#verifieragent)
3. [SettlementAgent](#settlementagent)
4. [Message Types](#message-types)
5. [Error Handling](#error-handling)
6. [Configuration](#configuration)

---

## AnalyzerAgent

The AnalyzerAgent is responsible for querying Hedera account information and generating analysis proposals.

### Constructor

```typescript
constructor();
```

**Description**: Initializes the AnalyzerAgent with credentials from environment variables.

**Environment Variables Required**:

- `ANALYZER_AGENT_ID`: Hedera account ID for the agent
- `ANALYZER_PRIVATE_KEY`: Private key for the agent
- `HEDERA_ACCOUNT_ID`: Fallback main account ID
- `HEDERA_PRIVATE_KEY`: Fallback main private key

**Example**:

```typescript
const analyzer = new AnalyzerAgent();
```

### Methods

#### `async init(): Promise<void>`

**Description**: Initializes the agent and verifies connection to Hedera testnet.

**Returns**: `Promise<void>`

**Throws**:

- `Error`: If initialization fails
- `Error`: If credentials are invalid

**Example**:

```typescript
await analyzer.init();
// Output: 🔗 AnalyzerAgent initialized for Hedera testnet
```

#### `async queryAccount(accountId: string): Promise<AccountInfo>`

**Description**: Queries account information using Hedera SDK.

**Parameters**:

- `accountId` (string): Hedera account ID (e.g., "0.0.123456")

**Returns**: `Promise<AccountInfo>`

**AccountInfo Interface**:

```typescript
interface AccountInfo {
  accountId: string;
  balance: string;
  key: string;
  isDeleted: boolean;
  autoRenewPeriod: string;
}
```

**Throws**:

- `Error`: If account query fails
- `Error`: If account ID is invalid

**Example**:

```typescript
const accountData = await analyzer.queryAccount("0.0.123456");
console.log("Balance:", accountData.balance);
// Output: Balance: 3446.12525862 ℏ
```

#### `async queryAccountViaMirror(accountId: string): Promise<any>`

**Description**: Queries account information via Hedera Mirror Node API.

**Parameters**:

- `accountId` (string): Hedera account ID

**Returns**: `Promise<any>` - Raw mirror node response data

**Throws**:

- `Error`: If mirror node query fails
- `Error`: If network request fails

**Example**:

```typescript
const mirrorData = await analyzer.queryAccountViaMirror("0.0.123456");
console.log("Mirror data:", mirrorData);
```

#### `getHcsClient(): HCS10Client`

**Description**: Returns the HCS client for sending messages.

**Returns**: `HCS10Client` instance

**Throws**:

- `Error`: If HCS client is not available (demo mode)

**Example**:

```typescript
const hcsClient = analyzer.getHcsClient();
await hcsClient.sendMessage(topicId, message);
```

---

## VerifierAgent

The VerifierAgent validates analysis proposals and makes approval decisions.

### Constructor

```typescript
constructor();
```

**Description**: Initializes the VerifierAgent with credentials from environment variables.

**Environment Variables Required**:

- `VERIFIER_AGENT_ID`: Hedera account ID for the agent
- `VERIFIER_PRIVATE_KEY`: Private key for the agent
- `VERIFIER_TOPIC_ID`: HCS topic ID for receiving messages
- `SETTLEMENT_TOPIC_ID`: HCS topic ID for sending verification results

**Example**:

```typescript
const verifier = new VerifierAgent();
```

### Methods

#### `async init(): Promise<void>`

**Description**: Initializes the agent and starts message polling.

**Returns**: `Promise<void>`

**Throws**:

- `Error`: If initialization fails
- `Error`: If topic ID is missing

**Example**:

```typescript
await verifier.init();
// Output: VerifierAgent initialized and ready to process messages
// Output: 🔄 Polling for messages every 5 seconds...
```

#### `onMessage(type: string, handler: Function): void`

**Description**: Registers a custom message handler for specific message types.

**Parameters**:

- `type` (string): Message type to handle
- `handler` (Function): Handler function to call when message is received

**Returns**: `void`

**Example**:

```typescript
verifier.onMessage("custom_proposal", async (proposal) => {
  console.log("Custom proposal received:", proposal);
  // Custom validation logic
});
```

### Internal Methods

#### `private async validateProposal(proposal: AnalysisProposal): Promise<void>`

**Description**: Validates analysis proposals and sends verification results.

**Parameters**:

- `proposal` (AnalysisProposal): The proposal to validate

**Business Logic**:

- Approval criteria: `proposal.meetsThreshold === true`
- Sends verification result to SettlementAgent on approval
- Logs rejection for non-approved proposals

---

## SettlementAgent

The SettlementAgent executes payments and records settlement completion.

### Constructor

```typescript
constructor();
```

**Description**: Initializes the SettlementAgent with credentials and wallet configuration.

**Environment Variables Required**:

- `SETTLEMENT_AGENT_ID`: Hedera account ID for the agent
- `SETTLEMENT_PRIVATE_KEY`: Private key for the agent
- `SETTLEMENT_TOPIC_ID`: HCS topic ID for receiving messages
- `BASE_RPC_URL`: Base Sepolia RPC endpoint
- `SETTLEMENT_WALLET_PRIVATE_KEY`: Ethereum wallet private key
- `USDC_CONTRACT`: USDC contract address
- `MERCHANT_WALLET_ADDRESS`: Merchant wallet address
- `ANALYZER_TOPIC_ID`: HCS topic ID for sending settlement records

**Example**:

```typescript
const settlement = new SettlementAgent();
```

### Methods

#### `async init(): Promise<void>`

**Description**: Initializes the agent and starts message polling.

**Returns**: `Promise<void>`

**Throws**:

- `Error`: If initialization fails
- `Error`: If required environment variables are missing

**Example**:

```typescript
await settlement.init();
// Output: SettlementAgent initialized for Hedera testnet
// Output: 📡 Agent is now listening for verification results...
```

### Internal Methods

#### `private async executeSettlement(verification: VerificationResult): Promise<void>`

**Description**: Executes x402 payments when verification is approved.

**Parameters**:

- `verification` (VerificationResult): The verification result containing approval

**Process**:

1. Creates x402 payment requirements
2. Executes payment via a2a-x402 library
3. Records settlement completion

**Payment Configuration**:

```typescript
const requirements = {
  scheme: "exact" as const,
  network: "base-sepolia" as const,
  asset: process.env.USDC_CONTRACT,
  payTo: process.env.MERCHANT_WALLET_ADDRESS,
  maxAmountRequired: "10000000", // 10 USDC
  resource: "/agent-settlement",
  description: "A2A agent settlement",
  mimeType: "application/json",
  maxTimeoutSeconds: 120,
};
```

#### `private async recordSettlement(txHash: string, amount: number): Promise<void>`

**Description**: Records settlement completion on HCS.

**Parameters**:

- `txHash` (string): Transaction hash of the payment
- `amount` (number): Amount settled in USDC

**Process**:

1. Creates settlement record
2. Broadcasts to HCS topic
3. Confirms completion

---

## Message Types

### Analysis Proposal

```typescript
interface AnalysisProposal {
  type: "analysis_proposal";
  accountId: string;
  balance: string;
  threshold: number;
  meetsThreshold: boolean;
  timestamp: number;
}
```

**Example**:

```json
{
  "type": "analysis_proposal",
  "accountId": "0.0.123456",
  "balance": "3446.12525862 ℏ",
  "threshold": 50,
  "meetsThreshold": true,
  "timestamp": 1703123456789
}
```

### Verification Result

```typescript
interface VerificationResult {
  type: "verification_result";
  originalProposal: AnalysisProposal;
  approved: boolean;
  reasoning: string;
  timestamp: number;
}
```

**Example**:

```json
{
  "type": "verification_result",
  "originalProposal": {
    "type": "analysis_proposal",
    "accountId": "0.0.123456",
    "balance": "3446.12525862 ℏ",
    "threshold": 50,
    "meetsThreshold": true,
    "timestamp": 1703123456789
  },
  "approved": true,
  "reasoning": "Proposal approved: meets threshold requirements (true)",
  "timestamp": 1703123456790
}
```

### Settlement Complete

```typescript
interface SettlementRecord {
  type: "settlement_complete";
  txHash: string;
  amount: string;
  timestamp: number;
}
```

**Example**:

```json
{
  "type": "settlement_complete",
  "txHash": "0x1234567890abcdef...",
  "amount": "10 USDC",
  "timestamp": 1703123456791
}
```

---

## Error Handling

### Common Error Types

#### Credential Errors

```typescript
// Missing credentials
Error: Missing required environment variables: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY

// Invalid private key format
Error: Invalid private key format. Tried DER, ED25519, and ECDSA formats.

// Account access failure
Error: Failed to verify account access. Please check your credentials.
```

#### Network Errors

```typescript
// Hedera connection failure
Error: Failed to connect to Hedera testnet

// Mirror node failure
Error: Failed to query account 0.0.123456 via mirror node

// HCS message failure
Error: Failed to send message: Failed to retrieve profile
```

#### Payment Errors

```typescript
// Settlement execution failure
Error: Error executing settlement: Insufficient funds

// x402 protocol error
Error: Payment execution failed: Invalid requirements
```

### Error Handling Patterns

#### Graceful Degradation

```typescript
// Fallback to main account credentials
if (privateKey.startsWith("placeholder-key-for-")) {
  console.warn(
    "⚠️  Using placeholder private key. Falling back to main account."
  );
  this.hcsClient = new HCS10Client(mainAccountId, mainPrivateKey, "testnet");
}
```

#### Demo Mode

```typescript
// Demo mode for missing credentials
if (!this.hederaClient || !this.hcsClient) {
  console.log("🔗 AnalyzerAgent initialized in demo mode");
  return;
}
```

#### Retry Logic

```typescript
// Exponential backoff for network requests
try {
  const result = await this.hcsClient.getMessages(topicId);
} catch (error) {
  console.error("❌ Error polling for messages:", error);
  // Retry on next interval
}
```

---

## Configuration

### Environment Variables

#### Required Variables

```bash
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

# Agent Credentials (Auto-generated)
ANALYZER_AGENT_ID=0.0.789012
ANALYZER_TOPIC_ID=0.0.345678
ANALYZER_PRIVATE_KEY=agent_private_key

VERIFIER_AGENT_ID=0.0.789013
VERIFIER_TOPIC_ID=0.0.345679
VERIFIER_PRIVATE_KEY=agent_private_key

SETTLEMENT_AGENT_ID=0.0.789014
SETTLEMENT_TOPIC_ID=0.0.345680
SETTLEMENT_PRIVATE_KEY=agent_private_key

# Settlement Configuration
BASE_RPC_URL=https://sepolia.base.org
SETTLEMENT_WALLET_PRIVATE_KEY=0x...
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
MERCHANT_WALLET_ADDRESS=0x...
```

#### Optional Variables

```bash
# Debug mode
DEBUG=hedron-agent-sdk:*

# Custom polling interval (default: 5000ms)
POLLING_INTERVAL=5000

# Custom timeout (default: 120s)
PAYMENT_TIMEOUT=120
```

### Network Configuration

#### Hedera Testnet

```typescript
// Client configuration
const client = Client.forTestnet();
client.setOperator(AccountId.fromString(accountId), privateKey);

// Mirror node URL
const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com";
```

#### Base Sepolia

```typescript
// Provider configuration
const provider = new JsonRpcProvider("https://sepolia.base.org");
const wallet = new Wallet(privateKey, provider);

// USDC contract
const USDC_CONTRACT = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
```

---

## Usage Examples

### Basic Agent Initialization

```typescript
import { AnalyzerAgent, VerifierAgent, SettlementAgent } from "./src/agents";

async function initializeAgents() {
  const analyzer = new AnalyzerAgent();
  const verifier = new VerifierAgent();
  const settlement = new SettlementAgent();

  await analyzer.init();
  await verifier.init();
  await settlement.init();

  console.log("All agents initialized successfully");
}
```

### Custom Message Handling

```typescript
// Register custom handler
verifier.onMessage("custom_proposal", async (proposal) => {
  console.log("Custom proposal received:", proposal);

  // Custom validation logic
  const isValid = await validateCustomProposal(proposal);

  if (isValid) {
    // Send custom response
    await verifier.getHcsClient().sendMessage(
      process.env.CUSTOM_TOPIC_ID!,
      JSON.stringify({
        type: "custom_response",
        proposal: proposal,
        validated: true,
        timestamp: Date.now(),
      })
    );
  }
});
```

### Manual Message Sending

```typescript
// Send analysis proposal manually
const proposal = {
  type: "analysis_proposal",
  accountId: "0.0.123456",
  balance: "100 ℏ",
  threshold: 50,
  meetsThreshold: true,
  timestamp: Date.now(),
};

await analyzer
  .getHcsClient()
  .sendMessage(process.env.VERIFIER_TOPIC_ID!, JSON.stringify(proposal));
```

### Error Handling Example

```typescript
try {
  const accountData = await analyzer.queryAccount("0.0.123456");
  console.log("Account balance:", accountData.balance);
} catch (error) {
  if (error.message.includes("INVALID_ACCOUNT_ID")) {
    console.error("Invalid account ID provided");
  } else if (error.message.includes("NETWORK_ERROR")) {
    console.error("Network connection failed");
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Performance Considerations

### Polling Intervals

- **Default**: 5 seconds
- **Customizable**: Via `POLLING_INTERVAL` environment variable
- **Impact**: Lower intervals = higher responsiveness, higher resource usage

### Timeout Settings

- **Payment Timeout**: 120 seconds (default)
- **Network Timeout**: 30 seconds (default)
- **Retry Attempts**: 3 attempts with exponential backoff

### Resource Usage

- **Memory**: ~50MB per agent instance
- **CPU**: Low usage for polling operations
- **Network**: Efficient HCS message batching

---

_Last Updated: December 2024_
_Version: 1.0.0_
