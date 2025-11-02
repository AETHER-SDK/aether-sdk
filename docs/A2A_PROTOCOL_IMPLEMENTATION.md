# A2A Protocol Implementation

## Overview

This document describes our implementation of the Google A2A (Agent-to-Agent) protocol for the Hedera hackathon bounty "Best Use of Hedera Agent Kit & Google A2A ($4,000)".

## A2A Protocol

The A2A protocol enables agents to communicate with each other in a standardized way. Our implementation follows the Google A2A protocol specification while integrating with Hedera Consensus Service (HCS) for message routing.

### Key Features

1. **Standardized Message Format** - All messages follow the A2A protocol format
2. **Agent Discovery** - Agents can discover each other via handshake protocol
3. **Message Routing** - Messages are routed via Hedera HCS topics
4. **Negotiation Support** - Built-in negotiation protocol for payment terms
5. **Signature Verification** - Cryptographic message signing and verification

## A2A Message Structure

```typescript
interface A2AMessage {
  version: "1.0";
  sender: {
    agentId: string;
    capabilities: string[];
    network: "hedera-testnet";
  };
  receiver: {
    agentId: string;
  };
  messageType: "request" | "response" | "notification";
  payload: any;
  timestamp: number;
  nonce: string;
  signature?: string;
}
```

## Usage

### Initialize A2A Protocol

```typescript
import { A2AProtocol } from "./protocols/A2AProtocol";
import { HCS10Client } from "@hashgraphonline/standards-agent-kit";

const hcsClient = new HCS10Client(agentId, privateKey, "testnet");
const a2a = new A2AProtocol(hcsClient, agentId, ["payment", "settlement"]);
```

### Send A2A Message

```typescript
await a2a.sendMessage(topicId, receiverAgentId, "request", {
  type: "payment_request",
  amount: "1000000",
  currency: "USDC",
});
```

### Receive and Parse A2A Message

```typescript
const message = a2a.parseMessage(messageContent);
if (message) {
  console.log(
    `Received A2A ${message.messageType} from ${message.sender.agentId}`
  );
}
```

## Handshake Protocol

Agents use the handshake protocol to discover each other and establish communication channels.

### Initiating Handshake

```typescript
import { A2AHandshakeProtocol } from "./protocols/A2AProtocol";

const handshake = new A2AHandshakeProtocol(a2a);
await handshake.initiateHandshake(
  topicId,
  targetAgentId,
  ["payment", "settlement"],
  ["A2A", "AP2"]
);
```

### Processing Handshake Response

```typescript
const message = a2a.parseMessage(messageContent);
if (message.payload.type === "handshake") {
  console.log("Handshake response received");
}
```

## Integration with Existing Agents

Our existing agents (AnalyzerAgent, VerifierAgent, SettlementAgent) have been enhanced to support A2A protocol:

- **AnalyzerAgent**: Sends A2A analysis proposals
- **VerifierAgent**: Sends A2A verification results
- **SettlementAgent**: Sends A2A payment confirmations

## Benefits of A2A Protocol

1. **Interoperability**: Agents from different systems can communicate
2. **Standardization**: Common message format across all agents
3. **Discovery**: Agents can find each other automatically
4. **Extensibility**: Easy to add new message types and capabilities
5. **Security**: Cryptographic signatures for message authentication

## Files

- `src/protocols/A2AProtocol.ts` - Core A2A protocol implementation
- `src/protocols/A2ANegotiation.ts` - Negotiation protocol for agent-to-agent bargaining
- `src/protocols/AP2Protocol.ts` - AP2 payment protocol implementation
- `src/modes/HumanInTheLoopMode.ts` - Human approval workflows

## References

- Google A2A Documentation: https://google.github.io/adk-docs/a2a/intro/
- A2A Project: https://github.com/a2aproject/A2A
- Hedera Consensus Service: https://docs.hedera.com/hedera/hedera-1/consensus-service
