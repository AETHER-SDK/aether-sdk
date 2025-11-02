/**
 * Intelligent Verifier Agent with LLM Reasoning
 * 
 * This agent uses OpenAI LLM to make intelligent decisions about:
 * - Invoice validation and fraud detection
 * - Payment approval with context-aware reasoning
 * - Negotiation with counter-offers
 * - Anomaly detection in transactions
 * 
 * Demonstrates the power of AI + blockchain for autonomous decisions
 */

import { ChatOpenAI } from '@langchain/openai'
import { HCS10Client } from '@hashgraphonline/standards-agent-kit'
import { loadEnvIfNeeded } from '../utils/env'
import chalk from 'chalk'

loadEnvIfNeeded()

export class IntelligentVerifierAgent {
  private llm?: ChatOpenAI
  private hcsClient?: HCS10Client
  private agentId: string
  private useLLM: boolean

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    const agentId = process.env.VERIFIER_AGENT_ID || process.env.HEDERA_ACCOUNT_ID
    const privateKey = process.env.VERIFIER_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY

    this.agentId = agentId || 'demo-agent'
    
    // Try to initialize HCS client, but don't fail if credentials are missing
    if (agentId && privateKey) {
      try {
        this.hcsClient = new HCS10Client(agentId, privateKey, 'testnet')
      } catch (error) {
        // Ignore initialization errors - we'll use LLM without HCS
        console.log(chalk.yellow('⚠️  Could not initialize HCS client'))
      }
    }

    this.useLLM = !!apiKey

    // Initialize LLM only if API key is provided
    if (apiKey) {
      try {
        this.llm = new ChatOpenAI({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          maxTokens: 500
        })
        console.log(chalk.green('✅ Intelligent Verifier Agent initialized with LLM reasoning'))
      } catch (error) {
        console.log(chalk.yellow('⚠️  LLM initialization failed - falling back to rule-based validation'))
      }
    } else {
      console.log(chalk.yellow('⚠️  No OpenAI API key - falling back to rule-based validation'))
    }
  }

  /**
   * Intelligent invoice validation using LLM reasoning
   */
  async analyzeInvoiceWithReasoning(invoice: any): Promise<{ 
    approved: boolean
    reasoning: string
    confidence: number
    riskFactors: string[]
  }> {
    if (!this.useLLM || !this.llm) {
      // Fallback to rule-based validation
      return this.analyzeInvoiceRuleBased(invoice)
    }

    try {
      console.log(chalk.blue('🤖 LLM analyzing invoice with intelligent reasoning...'))

      const systemPrompt = `You are an intelligent financial agent analyzing invoices for automated payment.
Your task is to validate the invoice, detect potential fraud, and approve or reject based on risk assessment.

Business Rules:
- Amounts < $500: Usually approved automatically
- Amounts $500-$2000: Require scrutiny
- Amounts > $2000: Require detailed analysis

Common Red Flags: Unusual patterns, unfamiliar vendors, round numbers without context, inconsistent metadata.

Respond in JSON format: {approved: boolean, confidence: 0-100, reasoning: string, riskFactors: [string]}`

      const userPrompt = `Analyze this invoice:
ID: ${invoice.invoiceId}
Amount: $${invoice.amountUSD}
Description: ${invoice.description}
Vendor: ${invoice.vendorAccountId}
Due Date: ${invoice.dueDate.toISOString()}
Category: ${invoice.category}
Urgency: ${invoice.urgency}`

      const response = await this.llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])
      
      const reasoning = response.content as string

      // Parse LLM response
      let result = this.parseLLMResponse(reasoning)

      console.log(chalk.green('✅ LLM analysis complete'))
      console.log(chalk.blue(`📊 Decision: ${result.approved ? 'APPROVED' : 'REJECTED'}`))
      console.log(chalk.blue(`🎯 Confidence: ${result.confidence}%`))
      console.log(chalk.blue(`💡 Reasoning: ${result.reasoning}`))

      return result

    } catch (error) {
      console.error(chalk.red(`❌ LLM analysis failed: ${(error as Error).message}`))
      return this.analyzeInvoiceRuleBased(invoice)
    }
  }

  /**
   * Parse LLM response (handles both JSON and plain text)
   */
  private parseLLMResponse(reasoning: string): { 
    approved: boolean
    reasoning: string
    confidence: number
    riskFactors: string[]
  } {
    try {
      // Try to extract JSON
      const jsonMatch = reasoning.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          approved: parsed.approved !== false,
          reasoning: parsed.reasoning || 'No reasoning provided',
          confidence: parsed.confidence || 50,
          riskFactors: parsed.riskFactors || []
        }
      }

      // If no JSON, parse text response
      const approved = reasoning.toLowerCase().includes('approve') && !reasoning.toLowerCase().includes('not approve')
      return {
        approved,
        reasoning,
        confidence: approved ? 75 : 25,
        riskFactors: []
      }
    } catch (error) {
      return {
        approved: true,
        reasoning: reasoning,
        confidence: 50,
        riskFactors: []
      }
    }
  }

  /**
   * Fallback rule-based analysis
   */
  private analyzeInvoiceRuleBased(invoice: any): { 
    approved: boolean
    reasoning: string
    confidence: number
    riskFactors: string[]
  } {
    const riskFactors: string[] = []
    let approved = true

    // Check amount
    if (invoice.amountUSD > 2000) {
      riskFactors.push('High amount (>$2000)')
      approved = false
      return {
        approved: false,
        reasoning: 'Amount exceeds rule-based threshold of $2000',
        confidence: 80,
        riskFactors
      }
    }

    if (invoice.amountUSD > 500) {
      riskFactors.push('Medium amount ($500-$2000)')
    }

    // Check if vendor account is provided
    if (!invoice.vendorAccountId || invoice.vendorAccountId === '0.0.XXXXXX') {
      approved = false
      riskFactors.push('Invalid vendor account')
      return {
        approved: false,
        reasoning: 'Invalid or missing vendor account ID',
        confidence: 90,
        riskFactors
      }
    }

    // Check description
    if (!invoice.description || invoice.description.length < 10) {
      riskFactors.push('Insufficient description')
    }

    return {
      approved,
      reasoning: approved 
        ? `Rule-based validation passed. Amount: $${invoice.amountUSD} within acceptable range.`
        : 'Rule-based validation failed due to risk factors',
      confidence: 70,
      riskFactors
    }
  }

  /**
   * Intelligent fraud detection
   */
  async detectFraud(transaction: any): Promise<{ 
    isFraud: boolean
    riskScore: number
    reasoning: string
    recommendations: string[]
  }> {
    if (!this.useLLM || !this.llm) {
      return {
        isFraud: false,
        riskScore: 0,
        reasoning: 'LLM not available for fraud detection',
        recommendations: []
      }
    }

    try {
      console.log(chalk.blue('🔍 LLM checking for fraud patterns...'))

      const systemPrompt = `You are a fraud detection agent. Analyze transactions for suspicious patterns.

VALID: Hedera account IDs (0.0.XXXXXX), reasonable amounts for B2B ($1-$10000), typical business descriptions.

RED FLAGS:
- Amounts outside $1-$10000 range
- Vague or suspicious descriptions ("urgent payment needed")
- Multiple rapid transactions in short time
- Amounts with suspicious patterns (e.g., $1234.56)

Respond in JSON only: {"isFraud": false, "riskScore": 0-100, "reasoning": "brief explanation", "recommendations": []}`

      const userPrompt = `Transaction:
Amount: $${transaction.amount}
Vendor: ${transaction.vendorAccountId}
Description: ${transaction.description}
Timestamp: ${transaction.timestamp}`

      const response = await this.llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])
      
      const reasoning = response.content as string

      // Parse response
      const jsonMatch = reasoning.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          isFraud: parsed.isFraud || false,
          riskScore: parsed.riskScore || 0,
          reasoning: parsed.reasoning || 'No fraud detected',
          recommendations: parsed.recommendations || []
        }
      }

      return {
        isFraud: false,
        riskScore: 0,
        reasoning,
        recommendations: []
      }
    } catch (error) {
      console.error(chalk.red(`❌ Fraud detection failed: ${(error as Error).message}`))
      return {
        isFraud: false,
        riskScore: 0,
        reasoning: 'Fraud detection unavailable',
        recommendations: []
      }
    }
  }

  async init(): Promise<void> {
    const topicId = process.env.VERIFIER_TOPIC_ID
    if (!topicId) {
      console.log(chalk.yellow('⚠️  No topic ID - agent will not poll'))
      return
    }

    console.log(chalk.green('✅ Intelligent Verifier Agent ready'))
    console.log(chalk.blue(`📡 Topic ID: ${topicId}`))
    console.log(chalk.blue(`🤖 LLM Reasoning: ${this.useLLM ? 'Enabled' : 'Disabled'}`))
  }
}
