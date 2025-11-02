// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Supply Chain Agreement Smart Contract
 * 
 * This contract implements autonomous supply chain negotiations
 * deployed on Hedera EVM. It manages escrow, delivery confirmation,
 * and automatic fund release.
 */
contract SupplyChainAgreement {
    address public buyer;
    address public vendor;
    
    struct Terms {
        uint256 pricePerUnit;
        uint256 quantity;
        uint256 deliveryDeadline;
        uint256 paymentScheduleDays;
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
        uint256 totalValue,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        address indexed confirmer,
        uint256 timestamp
    );
    
    event FundsReleased(
        address indexed vendor,
        uint256 amount,
        uint256 timestamp
    );
    
    event Refunded(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * Constructor - Creates agreement with negotiated terms
     */
    constructor(
        address _buyer,
        address _vendor,
        uint256 _pricePerUnit,
        uint256 _quantity,
        uint256 _deliveryDeadline,
        uint256 _paymentScheduleDays,
        uint256 _warrantyMonths
    ) payable {
        require(_buyer != address(0), "Buyer address required");
        require(_vendor != address(0), "Vendor address required");
        require(_pricePerUnit > 0, "Price must be greater than 0");
        require(_quantity > 0, "Quantity must be greater than 0");
        
        buyer = _buyer;
        vendor = _vendor;
        
        uint256 totalValue = _pricePerUnit * _quantity;
        terms = Terms({
            pricePerUnit: _pricePerUnit,
            quantity: _quantity,
            deliveryDeadline: _deliveryDeadline,
            paymentScheduleDays: _paymentScheduleDays,
            warrantyMonths: _warrantyMonths,
            totalValue: totalValue
        });
        
        depositAmount = msg.value;
        require(depositAmount >= totalValue, "Insufficient deposit");
        
        emit AgreementCreated(buyer, vendor, totalValue, block.timestamp);
    }
    
    /**
     * Confirm delivery - Called by buyer after receiving goods
     */
    function confirmDelivery() external {
        require(msg.sender == buyer, "Only buyer can confirm delivery");
        require(block.timestamp <= terms.deliveryDeadline || block.timestamp <= terms.deliveryDeadline + 86400, "Delivery deadline passed");
        require(!deliveryConfirmed, "Delivery already confirmed");
        
        deliveryConfirmed = true;
        emit DeliveryConfirmed(msg.sender, block.timestamp);
    }
    
    /**
     * Release funds - Called after delivery confirmation and payment schedule
     */
    function releaseFunds() external {
        require(deliveryConfirmed, "Delivery not confirmed");
        require(!fundsReleased, "Funds already released");
        
        // Check payment schedule (wait for paymentScheduleDays after delivery)
        require(block.timestamp >= terms.deliveryDeadline + terms.paymentScheduleDays * 1 days, "Payment schedule not met");
        
        fundsReleased = true;
        
        // Transfer funds to vendor
        (bool success, ) = payable(vendor).call{value: depositAmount}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(vendor, depositAmount, block.timestamp);
    }
    
    /**
     * Refund buyer if delivery deadline passed without confirmation
     */
    function refund() external {
        require(!deliveryConfirmed, "Cannot refund after delivery");
        require(block.timestamp > terms.deliveryDeadline + 7 days, "Grace period not passed");
        require(!fundsReleased, "Funds already released");
        
        (bool success, ) = payable(buyer).call{value: depositAmount}("");
        require(success, "Refund failed");
        
        emit Refunded(buyer, depositAmount, block.timestamp);
    }
    
    /**
     * Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * Get contract status
     */
    function getStatus() external view returns (
        bool _deliveryConfirmed,
        bool _fundsReleased,
        uint256 _balance
    ) {
        return (deliveryConfirmed, fundsReleased, address(this).balance);
    }
}

