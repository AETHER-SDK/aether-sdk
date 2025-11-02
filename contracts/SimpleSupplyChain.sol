// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Simple Supply Chain Contract
 * Demonstrates deployed contract on Hedera
 */
contract SimpleSupplyChain {
    string public greeting;
    address public buyer;
    address public vendor;
    uint256 public price;
    uint256 public quantity;
    bool public deployed;
    
    constructor(string memory _greeting) {
        greeting = _greeting;
        deployed = true;
    }
    
    function getDetails() public view returns (
        string memory _greeting,
        bool _deployed
    ) {
        return (greeting, deployed);
    }
}

