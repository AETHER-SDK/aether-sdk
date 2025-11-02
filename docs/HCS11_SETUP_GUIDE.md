# HCS-11 Profile Setup Guide

## Overview

HCS-11 profiles enable HCS-10 message sending by providing account metadata. The profiles must be:

1. Created on Hedera Consensus Service topics
2. Published to Kiloscribe CDN (for SDK retrieval)

## Current Issue

The `@hashgraphonline/standards-agent-kit` SDK expects HCS-11 profiles to be accessible from Kiloscribe CDN at:

```
https://kiloscribe.com/hcs-11/profile/{accountId}
```

This is an external service that we cannot programmatically populate.

## Available Setup Scripts

We have several scripts for HCS-11 setup:

### 1. Create Simple Profile

```bash
npm run create:simple-hcs11
```

Creates a minimal HCS-11 profile with multiple format variations to maximize CDN indexing.

### 2. Create Complete Profile

```bash
npm run create:complete-hcs11
```

Creates a comprehensive HCS-11 profile with all metadata, capabilities, and discovery messages.

### 3. Inscribe Profile Data

```bash
npm run inscribe:hcs11-data
```

Inscribes profile data to the HCS-11 topic.

### 4. Fix HCS-11 Memo

```bash
npx ts-node scripts/hcs11-setup/fix-hcs11-memo.ts
```

Sets the correct memo format: `hcs-11:hcs://1/{topicId}`

## Profile Registration Process

### Step 1: Create a Topic for the Profile

```typescript
const topicId = await createTopic(client, "HCS-11 Profile Topic");
```

### Step 2: Set Account Memo

Set the account memo to reference the profile topic:

```typescript
const memo = `hcs-11:hcs://1/${topicId}`;
await new AccountUpdateTransaction()
  .setAccountId(accountId)
  .setAccountMemo(memo)
  .execute(client);
```

### Step 3: Submit Profile Data to Topic

```typescript
const profile = {
  "@context": "https://hashgraphonline.com/docs/standards/hcs-11",
  "@type": "HCS11Profile",
  id: accountId,
  name: "Agent Name",
  // ... more profile data
};

await new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(JSON.stringify(profile))
  .execute(client);
```

### Step 4: Publish to Kiloscribe CDN

**This step requires external infrastructure:**

- Kiloscribe CDN must index your profile topic
- Profile must be accessible at `https://kiloscribe.com/hcs-11/profile/{accountId}`
- This is managed by Kiloscribe's CDN service

## Current Workaround

Since we cannot directly publish to Kiloscribe CDN, the E2E tests that require HCS-10 messaging will fail with the profile error.

**Solution:** The working tests (unit and integration) use local facilitators and don't require external HCS-11 CDN access.

## Testing Without HCS-11

The following tests work without HCS-11 setup:

- ✅ Unit tests (analyzer, verifier, settlement)
- ✅ Integration tests (x402, AP2, merchant agent)
- ✅ All tests that use local X402FacilitatorServer

## Kiloscribe CDN Requirements

To get E2E tests working with HCS-10 messaging, you need:

1. **HCS-11 Profile on Hedera** (done via scripts)
2. **Profile published to Kiloscribe CDN** (requires Kiloscribe service)
3. **Account memo set correctly** (already done)

The profile is created on topic `0.0.7133161` and can be viewed at:
https://hashscan.io/testnet/topic/0.0.7133161

## Alternative: Use Local HCS Bypass

If Kiloscribe CDN is not available, consider creating a local HCS profile resolver that:

1. Reads profiles from Hedera topics directly
2. Serves them via local HTTP server
3. Configure SDK to use local resolver instead of CDN

## Status Summary

✅ Profile created on Hedera topic  
✅ Account memo set correctly  
✅ Profile data inscribed  
❌ Profile not accessible via Kiloscribe CDN  
⚠️ E2E tests will fail until CDN is accessible

## Recommended Approach

For this repository:

1. **Unit tests** - Use local facilitators (working ✅)
2. **Integration tests** - Use X402FacilitatorServer (working ✅)
3. **E2E tests** - Require Kiloscribe CDN (documented ⚠️)

See `TEST_STATUS.md` for current test results.
