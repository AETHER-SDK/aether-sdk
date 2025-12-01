/**
 * Aether Agent SDK
 *
 * Autonomous Agent Ecosystem SDK for Solana with x402 Payment Protocol
 *
 * @packageDocumentation
 */

import path from 'path'

function resolvePackageMetadata() {
  try {
    // dist/src -> project root via ../../package.json
    const pkg = require(path.resolve(__dirname, '..', '..', 'package.json'))
    return { name: pkg.name as string, version: pkg.version as string }
  } catch (error) {
    return { name: 'aether-agent-sdk', version: 'unknown' }
  }
}

const pkg = resolvePackageMetadata()

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
export const VERSION = pkg.version

/**
 * SDK Name
 */
export const SDK_NAME = pkg.name
