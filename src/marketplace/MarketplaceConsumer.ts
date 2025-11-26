/**
 * Aether Marketplace Consumer
 * SDK for agents that consume services from the marketplace
 */

import axios from 'axios';
import { SettlementAgent } from '../agents/SettlementAgent';
import {
  MarketplaceSearchFilters,
  AgentSearchResult,
  Conversation,
  ConversationMessage,
  Order,
  Delivery,
  Review,
  DeliveryHandler,
  MarketplaceConfig,
} from './types';

/**
 * MarketplaceConsumer
 *
 * Use this class when your agent USES services from the marketplace.
 *
 * @example
 * ```typescript
 * const consumer = new MarketplaceConsumer({
 *   apiUrl: 'https://marketplace.aether.com/api',
 *   wallet: myKeypair
 * });
 *
 * // Search for translation agents
 * const agents = await consumer.search({
 *   category: 'Translation',
 *   maxPrice: 0.50
 * });
 *
 * // Start conversation
 * const conversation = await consumer.startConversation(agents[0].id, {
 *   message: "I need to translate 500 words"
 * });
 *
 * // Listen for responses
 * conversation.on('message', async (msg) => {
 *   if (msg.hasOrder) {
 *     await conversation.acceptOrder(msg.order.id, { paymentMethod: 'athr' });
 *   }
 * });
 *
 * // Listen for delivery
 * conversation.on('delivery', async (delivery) => {
 *   console.log('Received:', delivery.result);
 *   await conversation.review({ rating: 5 });
 * });
 * ```
 */
export class MarketplaceConsumer {
  private apiUrl: string;
  private wallet: any;
  private settlementAgent: SettlementAgent;
  private marketplaceWallet?: string;

  constructor(config: Omit<MarketplaceConfig, 'role' | 'profile' | 'services'>) {
    this.apiUrl = config.apiUrl;
    this.wallet = config.wallet;
    this.settlementAgent = new SettlementAgent();
  }

  /**
   * Initialize settlement agent and fetch marketplace info
   */
  async init(): Promise<void> {
    // Initialize settlement agent with the consumer's wallet
    await this.settlementAgent.init(this.wallet);

    // Fetch marketplace wallet from backend
    try {
      const response = await axios.get(`${this.apiUrl}/marketplace/info`);
      this.marketplaceWallet = response.data.marketplaceWallet;
      console.log(`📍 Marketplace wallet fetched: ${this.marketplaceWallet}`);
      console.log(`💰 Commission rate: ${(response.data.commissionRate * 100).toFixed(0)}%`);
    } catch (error: any) {
      console.error('⚠️  Failed to fetch marketplace info:', error.message);
      throw new Error('Could not initialize consumer: marketplace info unavailable');
    }
  }

  /**
   * Search for agents
   */
  async search(filters: MarketplaceSearchFilters = {}): Promise<AgentSearchResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/agents/search`, {
        params: filters,
      });

      return response.data.agents || [];
    } catch (error: any) {
      console.error('❌ Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/agents/${agentId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get agent:', error.message);
      throw error;
    }
  }

  /**
   * Start conversation with agent
   */
  async startConversation(
    agentId: string,
    options: { message: string; attachments?: any[] }
  ): Promise<ConversationWrapper> {
    try {
      // Get agent details to set merchant wallet
      const agentResponse = await axios.get(`${this.apiUrl}/agents/${agentId}`);
      const agent = agentResponse.data;

      // Set merchant wallet dynamically
      this.settlementAgent.setMerchantWallet(agent.ownerWallet);

      const response = await axios.post(`${this.apiUrl}/conversations`, {
        agentId,
        clientWallet: this.wallet.publicKey.toBase58(),
        message: options.message,
        attachments: options.attachments,
      });

      // API returns { conversationId, agentEndpoint }
      const conversationId = response.data.conversationId;

      // Build conversation object
      const conversation: Conversation = {
        id: conversationId,
        agentId: agentId,
        clientWallet: this.wallet.publicKey.toBase58(),
        clientType: 'agent',
        lastMessageAt: new Date(),
        status: 'active'
      };

      console.log('💬 Conversation started:', conversation.id);

      // Ensure marketplace wallet is available
      if (!this.marketplaceWallet) {
        throw new Error('Marketplace wallet not initialized. Did you call init()?');
      }

      return new ConversationWrapper(
        conversation,
        this.apiUrl,
        this.wallet,
        this.settlementAgent,
        this.marketplaceWallet
      );
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error.message);
      throw error;
    }
  }

  /**
   * Get existing conversation
   */
  async getConversation(conversationId: string): Promise<ConversationWrapper> {
    try {
      const response = await axios.get(`${this.apiUrl}/conversations/${conversationId}`);
      const conversation: Conversation = response.data;

      // Ensure marketplace wallet is available
      if (!this.marketplaceWallet) {
        throw new Error('Marketplace wallet not initialized. Did you call init()?');
      }

      return new ConversationWrapper(
        conversation,
        this.apiUrl,
        this.wallet,
        this.settlementAgent,
        this.marketplaceWallet
      );
    } catch (error: any) {
      console.error('❌ Failed to get conversation:', error.message);
      throw error;
    }
  }

  /**
   * Get all conversations for this wallet
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/conversations`, {
        params: { wallet: this.wallet.publicKey.toBase58() },
      });

      return response.data.conversations || [];
    } catch (error: any) {
      console.error('❌ Failed to get conversations:', error.message);
      throw error;
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await axios.get(`${this.apiUrl}/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get order:', error.message);
      throw error;
    }
  }

  /**
   * Get all orders for this wallet
   */
  async getOrders(status?: string): Promise<Order[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/orders`, {
        params: {
          wallet: this.wallet.publicKey.toBase58(),
          status,
        },
      });

      return response.data.orders || [];
    } catch (error: any) {
      console.error('❌ Failed to get orders:', error.message);
      throw error;
    }
  }
}

/**
 * ConversationWrapper
 * Wraps a conversation with helper methods
 */
export class ConversationWrapper {
  private conversation: Conversation;
  private apiUrl: string;
  private wallet: any;
  private settlementAgent: SettlementAgent;
  private marketplaceWallet: string;
  private messageHandlers: ((msg: ConversationMessage) => void)[] = [];
  private deliveryHandlers: ((delivery: Delivery) => void)[] = [];
  private pollingInterval?: NodeJS.Timeout;

  constructor(
    conversation: Conversation,
    apiUrl: string,
    wallet: any,
    settlementAgent: SettlementAgent,
    marketplaceWallet: string
  ) {
    this.conversation = conversation;
    this.apiUrl = apiUrl;
    this.wallet = wallet;
    this.settlementAgent = settlementAgent;
    this.marketplaceWallet = marketplaceWallet;
  }

  /**
   * Get conversation ID
   */
  get id(): string {
    return this.conversation.id;
  }

  /**
   * Send message
   */
  async send(message: string, attachments?: any[]): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/conversations/${this.conversation.id}/messages`, {
        fromWallet: this.wallet.publicKey.toBase58(),
        content: message,
        attachments,
      });
    } catch (error: any) {
      console.error('❌ Failed to send message:', error.message);
      throw error;
    }
  }

  /**
   * Get messages
   */
  async getMessages(limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/conversations/${this.conversation.id}/messages`,
        { params: { limit } }
      );

      return response.data.messages || [];
    } catch (error: any) {
      console.error('❌ Failed to get messages:', error.message);
      throw error;
    }
  }

  /**
   * Accept order and pay
   */
  async acceptOrder(
    orderId: string,
    options: { paymentMethod: 'usdc' | 'athr' }
  ): Promise<{ transactionSignature: string }> {
    try {
      // Get order details
      const orderResponse = await axios.get(`${this.apiUrl}/orders/${orderId}`);
      const order: Order = orderResponse.data;

      console.log(`💳 Accepting order ${orderId}`);
      console.log(`📊 Price: ${order.price} USDC`);

      // Ensure marketplace wallet is available
      if (!this.marketplaceWallet) {
        throw new Error('Marketplace wallet not initialized. Did you call init()?');
      }

      // Create signed payment with x402 to MARKETPLACE wallet (not directly to agent)
      // Backend will split 90% to agent, 10% commission
      const amount = options.paymentMethod === 'athr' ? order.price * 0.75 : order.price;

      console.log(`💰 Creating x402 payment to marketplace (${amount} ${options.paymentMethod.toUpperCase()})`);
      console.log(`📍 Marketplace wallet: ${this.marketplaceWallet}`);
      console.log(`📌 Backend will split: 90% to agent, 10% commission`);

      const paymentHeader = await this.settlementAgent.createSignedPayment(
        this.marketplaceWallet, // Pay marketplace, not agent directly
        amount
      );

      // Submit payment to marketplace
      const response = await axios.post(`${this.apiUrl}/orders/${orderId}/accept`, {
        clientWallet: this.wallet.publicKey.toBase58(),
        paymentMethod: options.paymentMethod.toUpperCase(),
        paymentHeader,
      });

      console.log('✅ Order accepted and paid:', orderId);
      console.log('📝 Payment TX:', response.data.transactionSignature);
      console.log(`💸 Agent receives: ${response.data.agentAmount} USDC`);
      console.log(`💰 Commission: ${response.data.commissionAmount} USDC`);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to accept order:', error.message);
      throw error;
    }
  }

  /**
   * Decline order proposal
   */
  async declineOrder(orderId: string, reason?: string): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/orders/${orderId}/decline`, {
        clientWallet: this.wallet.publicKey.toBase58(),
        reason,
      });

      console.log('❌ Order declined:', orderId);

      // Optionally send message to agent
      if (reason) {
        await this.send(`I'm declining the order: ${reason}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to decline order:', error.message);
      throw error;
    }
  }

  /**
   * Counter-offer with different price/terms
   */
  async counterOffer(
    orderId: string,
    offer: {
      price?: number;
      deliveryTime?: number;
      message: string;
    }
  ): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/orders/${orderId}/counter-offer`, {
        clientWallet: this.wallet.publicKey.toBase58(),
        ...offer,
      });

      console.log('💬 Counter-offer sent:', orderId);

      // Send message to agent
      await this.send(offer.message);
    } catch (error: any) {
      console.error('❌ Failed to send counter-offer:', error.message);
      throw error;
    }
  }

  /**
   * Review order
   */
  async review(orderId: string, review: Omit<Review, 'orderId' | 'agentId' | 'createdAt'>): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/orders/${orderId}/review`, {
        clientWallet: this.wallet.publicKey.toBase58(),
        ...review,
      });

      console.log('⭐ Review submitted:', orderId);
    } catch (error: any) {
      console.error('❌ Failed to submit review:', error.message);
      throw error;
    }
  }

  /**
   * Listen for new messages
   */
  on(event: 'message', handler: (msg: ConversationMessage) => void): void;
  on(event: 'delivery', handler: (delivery: Delivery) => void): void;
  on(event: string, handler: any): void {
    if (event === 'message') {
      this.messageHandlers.push(handler);

      // Start polling if not already started
      if (!this.pollingInterval) {
        this.startPolling();
      }
    } else if (event === 'delivery') {
      this.deliveryHandlers.push(handler);

      if (!this.pollingInterval) {
        this.startPolling();
      }
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  /**
   * Start polling for new messages and deliveries
   */
  private startPolling(intervalMs: number = 3000): void {
    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for new messages
        const response = await axios.get(
          `${this.apiUrl}/conversations/${this.conversation.id}/messages/new`,
          {
            params: { wallet: this.wallet.publicKey.toBase58() },
          }
        );

        const newMessages = response.data.messages || [];

        for (const msg of newMessages) {
          // Trigger message handlers
          for (const handler of this.messageHandlers) {
            handler(msg);
          }
        }

        // Poll for deliveries
        const deliveryResponse = await axios.get(
          `${this.apiUrl}/conversations/${this.conversation.id}/deliveries/new`,
          {
            params: { wallet: this.wallet.publicKey.toBase58() },
          }
        );

        const newDeliveries = deliveryResponse.data.deliveries || [];

        for (const delivery of newDeliveries) {
          // Trigger delivery handlers
          for (const handler of this.deliveryHandlers) {
            handler(delivery);
          }
        }
      } catch (error: any) {
        // Silent fail for polling
      }
    }, intervalMs);
  }
}
