/**
 * Aether Agent SDK
 *
 * Autonomous Agent Ecosystem SDK for Solana with x402 Payment Protocol
 *
 * @packageDocumentation
 */

import packageJson from '../package.json'

// Agents
export * from './agents'

// Facilitator
export * from './facilitator'

// Marketplace
export * from './marketplace'

// Utils
export * from './utils'

/**
 * SDK Version
 */
export const VERSION = packageJson.version

/**
 * SDK Name
 */
export const SDK_NAME = packageJson.name
