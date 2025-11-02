# Human-in-the-Loop Mode

## Overview

The Human-in-the-Loop (HITL) mode enables human oversight for autonomous agent operations. This is a requirement for bonus points in the hackathon bounty "Best Use of Hedera Agent Kit & Google A2A".

## Features

1. **Approval Workflows** - Agents pause and request human approval for sensitive operations
2. **Configurable Thresholds** - Set approval thresholds for different operation types
3. **Interactive CLI** - Simple yes/no interface for human decision-making
4. **Audit Trail** - Complete history of all approval requests and decisions
5. **Timeout Handling** - Configurable timeout with optional auto-approval

## Configuration

### Enable HITL Mode

```bash
# In .env file
HITL_ENABLED=true
HITL_PAYMENT_THRESHOLD=100  # USD equivalent
```

### Initialize HITL Mode

```typescript
import { HumanInTheLoopMode } from "./modes/HumanInTheLoopMode";

const hitl = new HumanInTheLoopMode({
  enabled: true,
  approvalThresholds: {
    payment: 100, // Require approval for payments >= $100
    transaction: 10, // Require approval for 10+ transactions
  },
  timeout: 300000, // 5 minutes
  autoApproveTimeout: false,
});
```

## Usage Examples

### Request Approval

```typescript
// Automatically check if approval is required
if (hitl.requiresApproval("payment", { amount: paymentAmount })) {
  const approval = await hitl.requestApproval({
    action: "payment",
    description: "Settlement payment to merchant",
    details: {
      amount: paymentAmount,
      recipient: merchantAddress,
      network: "base-sepolia",
    },
  });

  if (!approval.approved) {
    return; // Cancel operation
  }
}
```

### CLI Interaction

When HITL requests approval, the CLI will show:

```
🤔 HUMAN APPROVAL REQUIRED
─────────────────────────────────────────────────────
Request ID: approval-1234567890-abc123
Action: payment
Description: Settlement payment to merchant
Details: {
  "amount": 150,
  "recipient": "0x1234...",
  "network": "base-sepolia"
}
─────────────────────────────────────────────────────

Options:
[y] Yes - Approve and proceed
[n] No - Reject and cancel
[Enter your choice (y/n):]
```

## Configuration Options

### Payment Threshold

Set the USD equivalent threshold for automatic approval requests:

```typescript
hitl.setPaymentThreshold(100); // Require approval for payments >= $100
```

### Custom Thresholds

Define custom thresholds for specific actions:

```typescript
const hitl = new HumanInTheLoopMode({
  enabled: true,
  requireApprovalFor: ["high_value_payment", "cross_chain_transfer"],
  approvalThresholds: {
    payment: 100,
    transaction: 10,
    custom: new Map([
      ["high_value_payment", 1000],
      ["cross_chain_transfer", 500],
    ]),
  },
});
```

### Timeout Configuration

```typescript
const hitl = new HumanInTheLoopMode({
  enabled: true,
  timeout: 300000, // 5 minutes
  autoApproveTimeout: false, // Don't auto-approve on timeout
});
```

## Approval Flow

### Standard Flow

1. Agent initiates operation
2. Check if approval required via `requiresApproval()`
3. If required, call `requestApproval()`
4. Display approval request to user
5. User approves or rejects
6. Operation proceeds or is cancelled

### Timeout Flow

1. Approval request is sent
2. Timeout timer starts
3. If timeout expires and `autoApproveTimeout` is false:
   - Operation is cancelled
4. If timeout expires and `autoApproveTimeout` is true:
   - Operation proceeds automatically

## Integration with Agents

### SettlementAgent Example

```typescript
class SettlementAgent {
  private hitl: HumanInTheLoopMode;

  async executeSettlement(verification: any): Promise<void> {
    // Check if approval is required
    if (
      this.hitl.requiresApproval("payment", {
        amount: parseFloat(verification.paymentDetails.amount),
      })
    ) {
      const approval = await this.hitl.requestApproval({
        action: "settlement",
        description: `Payment of ${verification.paymentDetails.amount} ${verification.paymentDetails.currency}`,
        details: verification.paymentDetails,
      });

      if (!approval.approved) {
        console.log("Settlement denied by human");
        return;
      }
    }

    // Proceed with settlement
    await this.processPayment(verification);
  }
}
```

## Benefits

1. **Security** - Human oversight for high-value operations
2. **Compliance** - Meet regulatory requirements for autonomous systems
3. **Flexibility** - Balance between automation and human control
4. **Audit Trail** - Complete history of approvals
5. **Transparency** - Clear decision-making process

## Testing

Test HITL mode with different scenarios:

```typescript
// Test payment approval
const approval1 = await hitl.requestApproval({
  action: "payment",
  description: "Test payment",
  details: { amount: 150 },
});
// User enters 'y' - approval granted

// Test rejection
const approval2 = await hitl.requestApproval({
  action: "payment",
  description: "Test payment",
  details: { amount: 150 },
});
// User enters 'n' - approval denied

// Test timeout
const hitlWithTimeout = new HumanInTheLoopMode({
  enabled: true,
  timeout: 5000, // 5 seconds
});
```

## Files

- `src/modes/HumanInTheLoopMode.ts` - Core HITL implementation
- `src/agents/SettlementAgentEnhanced.ts` - Example integration

## Best Practices

1. Set appropriate thresholds based on risk tolerance
2. Use timeouts for time-sensitive operations
3. Provide clear descriptions in approval requests
4. Enable HITL only when necessary to avoid workflow disruption
5. Monitor approval history for compliance auditing
