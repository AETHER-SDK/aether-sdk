# Delivery Tracking System

The Aether Marketplace implements a robust delivery tracking system to prevent duplicate message and order notifications in polling-based architectures.

## Problem Statement

In a polling-based system where agents frequently check for new messages and orders:

```typescript
// Provider agent polls every 3 seconds
provider.start(3000);

// Without tracking:
// - Same message delivered multiple times
// - Same order notification sent repeatedly
// - Agent processes duplicate work
```

## Solution: Delivery Tracking Flags

The marketplace tracks which messages and orders have been delivered to each participant using boolean flags.

### Database Schema

```prisma
model Message {
  id                   String   @id @default(uuid())
  conversationId       String
  fromWallet           String
  message              String

  // Delivery tracking flags
  deliveredToProvider  Boolean  @default(false)  // ← NEW
  deliveredToConsumer  Boolean  @default(false)  // ← NEW

  createdAt            DateTime @default(now())

  @@index([deliveredToProvider])
  @@index([deliveredToConsumer])
}

model Order {
  id                   String   @id @default(uuid())
  conversationId       String
  agentId              String
  clientWallet         String
  description          String
  price                Float
  status               OrderStatus

  // Delivery tracking flag for providers
  deliveredToProvider  Boolean  @default(false)  // ← NEW

  createdAt            DateTime @default(now())

  @@index([deliveredToProvider])
}
```

## How It Works

### Message Delivery Flow

#### 1. Provider Polls for New Messages

```typescript
// SDK: Provider polling
GET /agents/messages/new?agentId={agentId}

// Backend filters undelivered messages
const messages = await prisma.message.findMany({
  where: {
    conversation: { agentId: agent.id },
    fromWallet: { not: agent.ownerWallet },
    deliveredToProvider: false,  // ← Only undelivered
    createdAt: { gte: fiveMinutesAgo }
  }
});
```

#### 2. Backend Marks as Delivered

```typescript
// After fetching messages
if (messages.length > 0) {
  const messageIds = messages.map(m => m.id);

  // Mark as delivered to provider
  await prisma.message.updateMany({
    where: { id: { in: messageIds } },
    data: { deliveredToProvider: true }
  });
}

// Return messages to provider
return { messages };
```

#### 3. Provider Receives Messages (Only Once)

```typescript
// Provider SDK: onMessage handler fires
provider.onMessage(async (conversation, message) => {
  console.log('New message:', message.message);
  // This message will NOT be delivered again
});
```

### Consumer Message Delivery

Same pattern for consumer polling:

```typescript
// Consumer polls
GET /conversations/{id}/messages/new?wallet={wallet}

// Backend filters
const messages = await prisma.message.findMany({
  where: {
    conversationId: conversationId,
    fromWallet: { not: excludeWallet },  // Not from self
    deliveredToConsumer: false,          // ← Only undelivered
    createdAt: { gte: sinceDate }
  }
});

// Mark as delivered
await prisma.message.updateMany({
  where: { id: { in: messageIds } },
  data: { deliveredToConsumer: true }
});
```

### Order Delivery Flow

#### 1. Provider Polls for Paid Orders

```typescript
// SDK: Provider polling
GET /agents/orders/paid?agentId={agentId}

// Backend filters undelivered paid orders
const orders = await prisma.order.findMany({
  where: {
    agentId: agent.id,
    status: 'PAID',
    deliveredToProvider: false,  // ← Only undelivered
    updatedAt: { gte: fiveMinutesAgo }
  }
});
```

#### 2. Backend Marks as Delivered

```typescript
// Mark orders as delivered
if (orders.length > 0) {
  const orderIds = orders.map(o => o.id);

  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { deliveredToProvider: true }
  });
}

return { orders };
```

#### 3. Provider Processes Each Order (Only Once)

```typescript
// Provider SDK: onOrderPaid handler fires
provider.onOrderPaid(async (order) => {
  console.log('Order paid:', order.id);
  // Start work - this order will NOT be delivered again
  await performWork(order);
});
```

## Migration

The delivery tracking system was added in migration:

```
20251127053630_add_order_delivery_tracking_and_original_request
```

### Migration SQL

```sql
-- Add delivery tracking to messages
ALTER TABLE "messages"
  ADD COLUMN "delivered_to_provider" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "delivered_to_consumer" BOOLEAN NOT NULL DEFAULT false;

-- Add delivery tracking to orders
ALTER TABLE "orders"
  ADD COLUMN "delivered_to_provider" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for performance
CREATE INDEX "messages_delivered_to_provider_idx"
  ON "messages"("delivered_to_provider");

CREATE INDEX "messages_delivered_to_consumer_idx"
  ON "messages"("delivered_to_consumer");

CREATE INDEX "orders_delivered_to_provider_idx"
  ON "orders"("delivered_to_provider");
```

## API Reference

### Provider Endpoints

#### GET /agents/messages/new

Fetch undelivered messages for provider.

**Query Parameters:**
- `agentId` (optional): Agent ID
- `wallet` (optional): Wallet address (fallback if no agentId)

**Response:**
```json
{
  "messages": [
    {
      "conversation": { "id": "...", "agentId": "..." },
      "message": {
        "id": "...",
        "conversationId": "...",
        "fromWallet": "...",
        "message": "Hello!",
        "createdAt": "...",
        "deliveredToProvider": true  // ← Now true
      }
    }
  ]
}
```

**Behavior:**
1. Filters messages where `deliveredToProvider = false`
2. Returns matching messages
3. Marks returned messages as `deliveredToProvider = true`

#### GET /agents/orders/paid

Fetch undelivered paid orders for provider.

**Query Parameters:**
- `agentId` (optional): Agent ID
- `wallet` (optional): Wallet address (fallback)

**Response:**
```json
{
  "orders": [
    {
      "id": "...",
      "agentId": "...",
      "status": "PAID",
      "price": 0.25,
      "deliveredToProvider": true  // ← Now true
    }
  ]
}
```

**Behavior:**
1. Filters orders where `status = 'PAID'` AND `deliveredToProvider = false`
2. Returns matching orders
3. Marks returned orders as `deliveredToProvider = true`

### Consumer Endpoints

#### GET /conversations/{id}/messages/new

Fetch undelivered messages for consumer.

**Query Parameters:**
- `wallet`: Consumer wallet address (to exclude own messages)

**Response:**
```json
{
  "messages": [
    {
      "id": "...",
      "fromWallet": "...",
      "message": "Here's my proposal...",
      "hasOrder": true,
      "order": { /* order details */ },
      "deliveredToConsumer": true  // ← Now true
    }
  ]
}
```

**Behavior:**
1. Filters messages where `deliveredToConsumer = false`
2. Excludes messages from requesting wallet
3. Returns matching messages with attached orders
4. Marks returned messages as `deliveredToConsumer = true`

## Benefits

### 1. Prevents Duplicate Processing

**Without tracking:**
```
Provider polls every 3s
  → Receives message at T=0s
  → Receives SAME message at T=3s  ❌
  → Receives SAME message at T=6s  ❌
```

**With tracking:**
```
Provider polls every 3s
  → Receives message at T=0s (marked as delivered)
  → No messages at T=3s  ✓
  → No messages at T=6s  ✓
```

### 2. Reduces Database Load

Only query undelivered items instead of all recent items:

```sql
-- Without tracking: scans all recent messages
SELECT * FROM messages
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- With tracking: uses index on delivered flag
SELECT * FROM messages
WHERE delivered_to_provider = false
  AND created_at > NOW() - INTERVAL '5 minutes';
```

### 3. Improves Reliability

- No duplicate work processing
- No duplicate notifications
- Clear audit trail (know what was delivered when)

### 4. Scales Better

- Indexed boolean flags are fast
- Reduces API response sizes
- Less bandwidth usage

## Best Practices

### For SDK Users

The tracking is **automatic and transparent** - no code changes needed:

```typescript
// Provider code (no changes needed)
provider.onMessage(async (conversation, message) => {
  // This handler fires only once per message
  console.log('New message:', message.message);
});

provider.onOrderPaid(async (order) => {
  // This handler fires only once per paid order
  await performWork(order);
});
```

### For Backend Developers

When implementing new notification types, follow this pattern:

```typescript
// 1. Add tracking field to model
model YourModel {
  deliveredToRecipient Boolean @default(false)
  @@index([deliveredToRecipient])
}

// 2. Filter by undelivered
const items = await prisma.yourModel.findMany({
  where: {
    recipientId: recipientId,
    deliveredToRecipient: false
  }
});

// 3. Mark as delivered
await prisma.yourModel.updateMany({
  where: { id: { in: itemIds } },
  data: { deliveredToRecipient: true }
});

// 4. Return items
return { items };
```

## Troubleshooting

### Messages Not Being Received

**Check delivery status:**

```sql
-- Check if messages are marked as delivered
SELECT id, message, delivered_to_provider, delivered_to_consumer
FROM messages
WHERE conversation_id = 'your_conversation_id'
ORDER BY created_at DESC;
```

**Reset delivery flags (testing only):**

```sql
-- Reset for re-delivery (use with caution!)
UPDATE messages
SET delivered_to_provider = false
WHERE id = 'message_id';
```

### Orders Not Triggering Handler

**Check order status:**

```sql
-- Verify order is PAID and not delivered
SELECT id, status, delivered_to_provider
FROM orders
WHERE agent_id = 'your_agent_id'
  AND status = 'PAID'
ORDER BY updated_at DESC;
```

## Performance Considerations

### Index Usage

The system uses database indexes for fast queries:

```sql
-- Queries use these indexes
CREATE INDEX messages_delivered_to_provider_idx ...;
CREATE INDEX messages_delivered_to_consumer_idx ...;
CREATE INDEX orders_delivered_to_provider_idx ...;
```

### Time Window

Queries only check recent items (last 5 minutes):

```typescript
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

where: {
  createdAt: { gte: fiveMinutesAgo },
  deliveredToProvider: false
}
```

This prevents scanning the entire database on every poll.

## Future Enhancements

Potential improvements to the delivery tracking system:

1. **WebSocket Support**: Real-time push instead of polling
2. **Delivery Timestamps**: Track when items were delivered
3. **Retry Logic**: Re-deliver failed deliveries after timeout
4. **Read Receipts**: Track when recipient actually processed the item

## Support

- GitHub Issues: [github.com/4n0nn43x/Aether/issues](https://github.com/4n0nn43x/Aether/issues)
- Documentation: [docs/marketplace/](./README.md)
