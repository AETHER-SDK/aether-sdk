# Scripts Directory

This directory contains utility scripts for setting up, maintaining, and troubleshooting the Hedron system.

## 📁 Directory Structure

```
scripts/
├── hcs11-setup/          # HCS-11 profile setup scripts
│   ├── setup-hcs11-memo.ts
│   ├── setup-hcs11-memo-fixed.ts
│   ├── create-hcs11-profile.ts
│   ├── inscribe-hcs11-profile-data.ts
│   ├── create-complete-hcs11-profile.ts
│   └── create-simple-hcs11-profile.ts
└── maintenance/          # System maintenance scripts
    ├── check-credentials-status.ts
    └── check-wallet-status.ts
```

## 🔧 HCS-11 Setup Scripts

### Basic Setup
- **`setup-hcs11-memo.ts`** - Initial HCS-11 memo setup (legacy)
- **`setup-hcs11-memo-fixed.ts`** - Fixed HCS-11 memo format
- **`create-hcs11-profile.ts`** - Create HCS-11 profile topic and memo

### Profile Data Inscription
- **`inscribe-hcs11-profile-data.ts`** - Basic profile data inscription
- **`create-complete-hcs11-profile.ts`** - Comprehensive profile with indexing
- **`create-simple-hcs11-profile.ts`** - Minimal profile for CDN compatibility

### Usage
```bash
# Complete HCS-11 setup (recommended)
npm run create:hcs11-profile
npm run create:simple-hcs11

# Alternative approaches
npm run inscribe:hcs11-data
npm run create:complete-hcs11
```

## 🛠️ Maintenance Scripts

### System Health Checks
- **`check-credentials-status.ts`** - Verify all account credentials and HCS topics
- **`check-wallet-status.ts`** - Check wallet balances and status

### Usage
```bash
# Check system health
npm run check:credentials
npm run check:wallets
```

## 📋 Script Execution Order

### For New Setup
1. `npm run setup:agents` - Register agents and create accounts
2. `npm run create:hcs11-profile` - Create HCS-11 profile topic
3. `npm run create:simple-hcs11` - Inscribe profile data
4. `npm run check:credentials` - Verify everything works

### For Troubleshooting
1. `npm run check:credentials` - Check current status
2. `npm run create:simple-hcs11` - Fix HCS-11 issues
3. `npm run demo` - Test system functionality

## 🎯 Quick Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `create:hcs11-profile` | Create profile topic and memo | Initial setup |
| `create:simple-hcs11` | Fix CDN issues | Troubleshooting |
| `check:credentials` | Verify system health | Regular maintenance |
| `check:wallets` | Check balances | Monitor funds |

## ⚠️ Important Notes

- All scripts require proper `.env` configuration
- HCS-11 scripts modify account memos (irreversible)
- Always run `check:credentials` after setup changes
- Test with `npm run demo` after any modifications

## 🔗 Related Documentation

- [Agent System Documentation](../docs/AGENT_SYSTEM_DOCUMENTATION.md)
- [Quick Setup Guide](../docs/QUICK_SETUP_GUIDE.md)
- [Final Status Report](../docs/FINAL_STATUS_REPORT.md)
