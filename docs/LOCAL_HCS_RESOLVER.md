# Local HCS-11 Profile Resolver

## Overview

A local HTTP server that serves HCS-11 profiles by reading from Hedera topics, bypassing the need for Kiloscribe CDN.

## Status

✅ **Implemented:** Local HTTP server  
⚠️ **Partial:** Topic query implementation needs SDK version fix  
✅ **Working:** HTTP endpoints serving profile data

## Usage

### Start the Resolver

```bash
npx ts-node src/facilitator/LocalHCSProfileResolver.ts
```

The server will start on port 3001.

### Test the Resolver

```bash
npm run test:local-hcs-resolver
# or directly:
npx ts-node tests/integration/test-local-hcs-resolver.ts
```

## Endpoints

### Health Check

```
GET http://localhost:3001/health
```

Response:

```json
{
  "status": "ok",
  "service": "LocalHCSProfileResolver"
}
```

### Profile Endpoint (Kiloscribe CDN Format)

```
GET http://localhost:3001/hcs-11/profile/{accountId}
```

Example:

```
GET http://localhost:3001/hcs-11/profile/0.0.7132337
```

Response:

```json
{
  "@context": "https://hashgraphonline.com/docs/standards/hcs-11",
  "@type": "HCS11Profile",
  "id": "0.0.7132337",
  "name": "Agent Coordinator",
  "status": "active"
}
```

### Topic Endpoint

```
GET http://localhost:3001/profile/{topicId}
```

Example:

```
GET http://localhost:3001/profile/0.0.7133161
```

## Configuration

The resolver reads from:

- **Profile Topic:** `0.0.7133161` (configured via HCS-11 setup)
- **Port:** `3001` (default, configurable)
- **Network:** Hedera Testnet

## Implementation Notes

### Current Status

1. ✅ HTTP server running with Express
2. ✅ Endpoints configured to match Kiloscribe CDN format
3. ✅ Profile data structure correct
4. ⚠️ Topic message query needs SDK version fix

### Topic Query Issue

The `TopicMessageQuery.subscribe()` method signature differs across SDK versions. Currently returns placeholder data.

**To Fix:**

- Update Hedera SDK to consistent version
- Implement proper topic message streaming
- Add message caching/DB for better performance

## Integration with SDK

**Current Limitation:**

The `@hashgraphonline/standards-agent-kit` SDK is hardcoded to fetch from Kiloscribe CDN:

```typescript
https://kiloscribe.com/hcs-11/profile/{accountId}
```

**Solutions:**

1. **Reverse Proxy:** Route Kiloscribe URLs to local resolver
2. **SDK Modification:** Patch SDK to use local URL
3. **Environment Variable:** Configure SDK base URL (if supported)

### Option 1: Reverse Proxy

Add to `/etc/hosts`:

```
127.0.0.1 kiloscribe.com
```

Run on port 80:

```bash
sudo npx ts-node src/facilitator/LocalHCSProfileResolver.ts --port 80
```

### Option 2: SDK Modification

Modify `HCS10Client` to support custom base URL:

```typescript
const baseUrl = process.env.HCS11_BASE_URL || "https://kiloscribe.com";
```

### Option 3: Environment Variable (Future)

If SDK adds support:

```bash
HCS11_BASE_URL=http://localhost:3001 npm run test:e2e
```

## Future Improvements

1. **Full Topic Query Implementation**
   - Fix SDK version compatibility
   - Implement proper message streaming
   - Add message history/caching

2. **Profile Caching**
   - Cache profiles in memory
   - Add Redis for distributed caching
   - Implement TTL/refresh logic

3. **Profile Database**
   - Store profiles in database
   - Support multiple profiles
   - Profile CRUD operations

4. **SDK Integration**
   - Pull request to add base URL config
   - Or fork SDK with local support
   - Or create wrapper library

## Testing

Test the resolver independently:

```bash
npm run test:local-hcs-resolver
```

Integration test with E2E:

```bash
# Terminal 1: Start resolver
npx ts-node src/facilitator/LocalHCSProfileResolver.ts

# Terminal 2: Run E2E tests
npm run test:e2e
```

## Files

- **Implementation:** `src/facilitator/LocalHCSProfileResolver.ts`
- **Test:** `tests/integration/test-local-hcs-resolver.ts`

## Summary

The Local HCS Profile Resolver provides a working foundation for serving HCS-11 profiles without external CDN dependencies. The basic HTTP server is functional, with topic query implementation pending SDK version alignment.

**Next Steps:**

1. Fix topic query implementation
2. Integrate with E2E tests via reverse proxy or SDK modification
3. Add profile caching for better performance
