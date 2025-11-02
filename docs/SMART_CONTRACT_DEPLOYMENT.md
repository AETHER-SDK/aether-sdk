# Smart Contract Deployment Guide

## How Supply Chain Negotiation Would Deploy Real Smart Contracts on Hedera

### Overview

In production, when agents reach an agreement, the system would:

1. **Deploy Solidity smart contract** to Hedera EVM
2. **Store negotiation terms** (price, delivery, payment schedule)
3. **Create payment escrow** for the agreed amount
4. **Enforce terms** via smart contract logic
5. **Release funds** when conditions are met

---

## Production Implementation

### Step 1: Write Solidity Contract

Create a contract to store terms and handle escrow:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChainAgreement {
    address public buyer;
    address public vendor;
    
    struct Terms {
        uint256 pricePerUnit;
        uint256 quantity;
        uint256 deliveryDeadline;
        uint256 paymentSchedule; // in days
        uint256 warrantyMonths;
        uint256 totalValue;
    }
    
    Terms public terms;
    uint256 public depositAmount;
    bool public deliveryConfirmed;
    bool public fundsReleased;
    
    event AgreementCreated(
        address indexed buyer,
        address indexed vendor,
        uint256 totalValue
    );
    
    event DeliveryConfirmed();
    event FundsReleased();
    
    constructor(
        address _buyer,
        address _vendor,
        uint256 _pricePerUnit,
        uint256 _quantity,
        uint256 _deliveryDeadline,
        uint256 _paymentSchedule,
        uint256 _warrantyMonths
    ) payable {
        buyer = _buyer;
        vendor = _vendor;
        
        uint256 totalValue = _pricePerUnit * _quantity;
        terms = Terms({
            pricePerUnit: _pricePerUnit,
            quantity: _quantity,
            deliveryDeadline: _deliveryDeadline,
            paymentSchedule: _paymentSchedule,
            warrantyMonths: _warrantyMonths,
            totalValue: totalValue
        });
        
        depositAmount = msg.value;
        require(depositAmount >= totalValue, "Insufficient deposit");
        
        emit AgreementCreated(buyer, vendor, totalValue);
    }
    
    function confirmDelivery() external {
        require(msg.sender == buyer, "Only buyer can confirm");
        require(block.timestamp <= terms.deliveryDeadline, "Delivery deadline passed");
        deliveryConfirmed = true;
        emit DeliveryConfirmed();
    }
    
    function releaseFunds() external {
        require(deliveryConfirmed, "Delivery not confirmed");
        require(!fundsReleased, "Funds already released");
        require(block.timestamp >= terms.paymentSchedule, "Payment schedule not met");
        
        fundsReleased = true;
        payable(vendor).transfer(depositAmount);
        emit FundsReleased();
    }
    
    function refund() external {
        require(!deliveryConfirmed, "Cannot refund after delivery");
        require(block.timestamp > terms.deliveryDeadline, "Delivery deadline not passed");
        
        payable(buyer).transfer(depositAmount);
    }
}
```

---

### Step 2: Deploy Contract Using Hedera SDK

Update the demo to actually deploy:

```typescript
import {
  Client,
  PrivateKey,
  ContractCreateFlow,
  FileCreateTransaction,
  ContractFunctionParameters,
  Hbar
} from '@hashgraph/sdk'

async function deploySupplyChainContract(
  buyerAddress: string,
  vendorAddress: string,
  terms: NegotiationTerms
): Promise<string> {
  const client = Client.forTestnet()
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
  )
  
  // Step 1: Compile Solidity contract (in production, use Hardhat/Truffle)
  const contractBytecode = await compileContract('SupplyChainAgreement.sol')
  
  // Step 2: Create file with bytecode
  const fileTx = await new FileCreateTransaction()
    .setContents(contractBytecode)
    .setKeys([client.operatorPublicKey!])
    .execute(client)
    
  const fileId = fileTx.getReceipt(client).fileId
  
  // Step 3: Deploy contract with constructor parameters
  const deployTx = await new ContractCreateFlow()
    .setGas(1_000_000)
    .setBytecodeFileId(fileId)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(buyerAddress)
        .addAddress(vendorAddress)
        .addUint256(terms.pricePerUnit)
        .addUint256(terms.quantity)
        .addUint256(new Date(terms.deliveryDate).getTime())
        .addUint256(30) // payment schedule in days
        .addUint256(terms.warrantyMonths)
    )
    .setInitialBalance(Hbar.fromTinybars(terms.pricePerUnit * terms.quantity))
    .execute(client)
  
  const contractId = deployTx.getReceipt(client).contractId
  console.log(`✅ Contract deployed: ${contractId}`)
  
  return contractId.toString()
}
```

---

### Step 3: Integration with Negotiation Demo

Update `demo/supply-chain-negotiation-demo.ts`:

```typescript
// After negotiation completes
if (vendorTerms && vendorTerms.status === 'accepted') {
  console.log('🚀 Deploying real smart contract to Hedera...')
  
  // Deploy contract with real SDK
  const contractId = await deploySupplyChainContract(
    process.env.BUYER_ADDRESS,
    process.env.VENDOR_ADDRESS,
    vendorTerms.terms
  )
  
  console.log(`✅ Contract Deployed: ${contractId}`)
  console.log(`🔗 HashScan: https://hashscan.io/testnet/contract/${contractId}`)
  
  // Verify contract on HashScan
  // Contract will enforce:
  // - Price: $85/unit
  // - Quantity: 1000 units
  // - Delivery: March 10, 2024
  // - Payment: Net 30
  // - Escrow: $85,000 held until delivery
}
```

---

## Production Workflow

### 1. **Negotiation Phase** (Current Demo)
- Buyer proposes terms
- Vendor counters
- Both agents negotiate
- Agreement reached

### 2. **Contract Deployment** (Add This)
- Compile Solidity contract
- Deploy to Hedera EVM
- Store contract ID in negotiation results
- Create payment escrow

### 3. **Execution Phase** (Smart Contract Logic)
- Vendor delivers goods
- Buyer confirms delivery
- Smart contract releases funds
- Warranty period starts

### 4. **Dispute Resolution** (If Needed)
- Smart contract handles disputes
- Escrow protects both parties
- Terms enforced automatically

---

## Example Production Flow

```
🤖 Agents Negotiate
  ↓
✅ Agreement Reached
  ↓
📝 Deploy Smart Contract to Hedera
  ↓
💰 Create $85K Payment Escrow
  ↓
📦 Vendor Delivers Goods
  ↓
✅ Buyer Confirms Delivery
  ↓
💸 Smart Contract Releases Funds
  ↓
📊 Transaction Verified on HashScan
```

---

## Technical Requirements

### To Implement Real Smart Contract Deployment:

1. **Install Dependencies**
```bash
npm install hardhat @nomicfoundation/hardhat-toolbox
```

2. **Create Hardhat Config**
```javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.19",
  networks: {
    hedera: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
}
```

3. **Compile Contract**
```bash
npx hardhat compile
```

4. **Deploy to Hedera**
```bash
npx hardhat run scripts/deploy.js --network hedera
```

5. **Verify on HashScan**
```bash
npx hardhat verify --network hedera <CONTRACT_ID>
```

---

## Next Steps

To make the demo deploy real contracts:

1. ✅ Add `hardhat` configuration
2. ✅ Write Solidity contract for terms
3. ✅ Update demo to deploy actual contract
4. ✅ Add escrow functionality
5. ✅ Test on Hedera testnet
6. ✅ Verify on HashScan

**Current Status:** Demo shows negotiation logic  
**Next:** Add actual contract deployment

---

## Benefits of Real Smart Contract

- ✅ **Trustless** - No need to trust counterparty
- ✅ **Automatic** - Terms enforced by code
- ✅ **Transparent** - All terms on blockchain
- ✅ **Secure** - Funds held in escrow
- ✅ **Irreversible** - Once deployed, can't be changed
- ✅ **Auditable** - HashScan shows all interactions

**This is what production AgentFlow would do!**

