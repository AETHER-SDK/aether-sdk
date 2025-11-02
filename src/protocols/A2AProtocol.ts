/**
 * A2A (Agent-to-Agent) Protocol Implementation
 * Based on JSON-RPC 2.0 for agent communication
 */

export interface A2AMessage {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

export interface A2AResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface Task {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: any
  output?: any
  error?: string
  createdAt: number
  updatedAt: number
}

export class A2AProtocol {
  private baseUrl: string
  private agentId: string

  constructor(baseUrl: string, agentId: string) {
    this.baseUrl = baseUrl
    this.agentId = agentId
  }

  async sendTask(input: any): Promise<Task> {
    const message: A2AMessage = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'sendTask',
      params: { input }
    }

    const response = await this.makeRequest(message)
    return response.result as Task
  }

  async getTask(taskId: string): Promise<Task> {
    const message: A2AMessage = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'getTask',
      params: { taskId }
    }

    const response = await this.makeRequest(message)
    return response.result as Task
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const message: A2AMessage = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'cancelTask',
      params: { taskId }
    }

    const response = await this.makeRequest(message)
    return response.result as boolean
  }

  private async makeRequest(message: A2AMessage): Promise<A2AResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Id': this.agentId
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }
}

export class A2AServer {
  private handlers: Map<string, (params: any) => Promise<any>>
  private tasks: Map<string, Task>

  constructor() {
    this.handlers = new Map()
    this.tasks = new Map()
  }

  registerHandler(method: string, handler: (params: any) => Promise<any>) {
    this.handlers.set(method, handler)
  }

  async handleRequest(message: A2AMessage): Promise<A2AResponse> {
    const handler = this.handlers.get(message.method)

    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      }
    }

    try {
      const result = await handler(message.params)
      return {
        jsonrpc: '2.0',
        id: message.id,
        result
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: (error as Error).message
        }
      }
    }
  }

  createTask(input: any): Task {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      input,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.tasks.set(task.id, task)
    return task
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    Object.assign(task, updates, { updatedAt: Date.now() })
    return task
  }

  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null
  }
}
