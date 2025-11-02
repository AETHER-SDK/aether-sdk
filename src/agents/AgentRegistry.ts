/**
 * HCS-10 Agent Registry
 * Manages agent registration, discovery, and metadata for HCS-10 compatible agents
 */

import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { loadEnvIfNeeded } from '../utils/env'
import chalk from 'chalk'

loadEnvIfNeeded()

export interface AgentMetadata {
  agentId: string
  agentName: string
  agentType: 'analyzer' | 'verifier' | 'settlement'
  capabilities: string[]
  supportedMessageTypes: string[]
  topicId: string
  status: 'active' | 'inactive'
  registrationTime?: number
}

export class AgentRegistry {
  private agents: Map<string, AgentMetadata> = new Map()
  
  /**
   * Register an agent in the local registry
   */
  registerAgent(metadata: AgentMetadata): void {
    this.agents.set(metadata.agentId, metadata)
    console.log(chalk.green(`✅ Registered agent: ${metadata.agentName} (${metadata.agentId})`))
    console.log(chalk.gray(`   Type: ${metadata.agentType}`))
    console.log(chalk.gray(`   Capabilities: ${metadata.capabilities.join(', ')}`))
    console.log(chalk.gray(`   Topic: ${metadata.topicId}`))
  }

  /**
   * Get agent metadata by ID
   */
  getAgent(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values())
  }

  /**
   * Discover agents by type
   */
  discoverAgentsByType(type: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter(agent => agent.agentType === type)
  }

  /**
   * Discover agents by capability
   */
  discoverAgentsByCapability(capability: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.includes(capability)
    )
  }

  /**
   * Check agent status
   */
  isAgentActive(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    return agent?.status === 'active'
  }

  /**
   * Get agent summary
   */
  getSummary(): string {
    const agents = this.getAllAgents()
    return chalk.blue(`📊 Agent Registry: ${agents.length} agents registered\n` +
      agents.map(agent => 
        `   ${agent.agentName} (${agent.agentType}) - ${agent.status}`
      ).join('\n')
    )
  }
}

// Global registry instance
export const globalAgentRegistry = new AgentRegistry()

// Register predefined agents from environment
export function initializeHCS10Agents(): void {
  // Analyzer Agent
  if (process.env.ANALYZER_AGENT_ID && process.env.ANALYZER_TOPIC_ID) {
    globalAgentRegistry.registerAgent({
      agentId: process.env.ANALYZER_AGENT_ID,
      agentName: 'AnalyzerAgent',
      agentType: 'analyzer',
      capabilities: ['account-analysis', 'threshold-evaluation', 'proposal-generation'],
      supportedMessageTypes: ['analysis_proposal', 'settlement_complete'],
      topicId: process.env.ANALYZER_TOPIC_ID,
      status: 'active',
      registrationTime: Date.now()
    })
  }

  // Verifier Agent
  if (process.env.VERIFIER_AGENT_ID && process.env.VERIFIER_TOPIC_ID) {
    globalAgentRegistry.registerAgent({
      agentId: process.env.VERIFIER_AGENT_ID,
      agentName: 'VerifierAgent',
      agentType: 'verifier',
      capabilities: ['proposal-validation', 'approval-decision', 'business-logic'],
      supportedMessageTypes: ['verification_result', 'analysis_proposal'],
      topicId: process.env.VERIFIER_TOPIC_ID,
      status: 'active',
      registrationTime: Date.now()
    })
  }

  // Settlement Agent
  if (process.env.SETTLEMENT_AGENT_ID && process.env.SETTLEMENT_TOPIC_ID) {
    globalAgentRegistry.registerAgent({
      agentId: process.env.SETTLEMENT_AGENT_ID,
      agentName: 'SettlementAgent',
      agentType: 'settlement',
      capabilities: ['x402-payment', 'cross-chain-settlement', 'usdc-transfer'],
      supportedMessageTypes: ['verification_result', 'settlement_complete'],
      topicId: process.env.SETTLEMENT_TOPIC_ID,
      status: 'active',
      registrationTime: Date.now()
    })
  }

  console.log(chalk.bold.green('\n🎯 HCS-10 Agents Initialized\n'))
  console.log(globalAgentRegistry.getSummary())
}

