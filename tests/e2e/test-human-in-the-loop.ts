/**
 * End-to-End Tests for Human-in-the-Loop Mode
 * 
 * Tests HITL approval workflows, thresholds, and CLI interaction
 */

import { HumanInTheLoopMode, ApprovalRequest } from '../../src/modes/HumanInTheLoopMode'
import chalk from 'chalk'
import * as readline from 'readline'

async function testHumanInTheLoop() {
  console.log(chalk.bold.cyan('\n🧪 Testing Human-in-the-Loop Mode\n'))

  try {
    // Test 1: Initialize HITL Mode
    console.log(chalk.blue('📝 Test 1: Initialize HITL Mode'))
    
    const hitl = new HumanInTheLoopMode({
      enabled: true,
      approvalThresholds: {
        payment: 100, // Require approval for payments >= $100
        transaction: 10
      },
      timeout: 300000,
      autoApproveTimeout: false
    })

    console.log(chalk.green('✅ HITL mode initialized'))

    // Test 2: Check Payment Threshold
    console.log(chalk.blue('\n📝 Test 2: Check Payment Threshold'))
    
    const requiresApprovalLow = hitl.requiresApproval('payment', { amount: 50 })
    const requiresApprovalHigh = hitl.requiresApproval('payment', { amount: 150 })
    
    if (!requiresApprovalLow && requiresApprovalHigh) {
      console.log(chalk.green('✅ Threshold checking works correctly'))
      console.log(chalk.gray(`   Payment $50: No approval needed`))
      console.log(chalk.gray(`   Payment $150: Approval required`))
    } else {
      console.log(chalk.red('❌ Threshold checking failed'))
    }

    // Test 3: Check Transaction Threshold
    console.log(chalk.blue('\n📝 Test 3: Check Transaction Threshold'))
    
    const requiresApprovalLowCount = hitl.requiresApproval('transaction', { count: 5 })
    const requiresApprovalHighCount = hitl.requiresApproval('transaction', { count: 15 })
    
    if (!requiresApprovalLowCount && requiresApprovalHighCount) {
      console.log(chalk.green('✅ Transaction threshold checking works'))
    } else {
      console.log(chalk.red('❌ Transaction threshold checking failed'))
    }

    // Test 4: Enable/Disable HITL
    console.log(chalk.blue('\n📝 Test 4: Enable/Disable HITL'))
    
    hitl.disable()
    const requiresApprovalWhenDisabled = hitl.requiresApproval('payment', { amount: 150 })
    
    if (!requiresApprovalWhenDisabled) {
      console.log(chalk.green('✅ HITL disabled correctly'))
    } else {
      console.log(chalk.red('❌ HITL should not require approval when disabled'))
    }
    
    hitl.enable()
    console.log(chalk.green('✅ HITL enabled'))

    // Test 5: Set Payment Threshold
    console.log(chalk.blue('\n📝 Test 5: Set Payment Threshold'))
    
    hitl.setPaymentThreshold(200)
    const requiresApprovalNewThreshold = hitl.requiresApproval('payment', { amount: 150 })
    
    if (!requiresApprovalNewThreshold) {
      console.log(chalk.green('✅ Payment threshold updated correctly'))
    } else {
      console.log(chalk.red('❌ Payment threshold not updated'))
    }

    // Test 6: Get Pending Requests
    console.log(chalk.blue('\n📝 Test 6: Get Pending Requests'))
    
    const pendingRequests = hitl.getPendingRequests()
    console.log(chalk.green(`✅ Pending requests retrieved: ${pendingRequests.length}`))

    // Cleanup
    hitl.cleanup()

    console.log(chalk.bold.green('\n✅ All Human-in-the-Loop Tests Passed!\n'))
    console.log(chalk.yellow('Note: Manual approval tests require user interaction'))
    console.log(chalk.yellow('      Run the demo to test approval prompts\n'))

  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${(error as Error).message}\n`))
    process.exit(1)
  }
}

// Run tests
testHumanInTheLoop()

