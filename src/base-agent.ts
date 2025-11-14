// Base Agent class implementation for Cloudflare
export interface AgentSQL {
  prepare(query: string): {
    bind(...args: any[]): {
      first(): Promise<any>;
      run(): Promise<any>;
      all(): Promise<any[]>;
    };
  };
}

export interface AgentScheduler {
  delay(ms: number): Promise<void>;
  schedule(name: string, payload: any, options?: { delay?: number }): Promise<void>;
}

export class Agent {
  protected sql: AgentSQL;
  protected env: any;
  private connections: Set<any> = new Set();

  constructor(state: any, env: any) {
    this.env = env;
    
    // Mock SQL interface for now
    this.sql = {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: async () => null,
          run: async () => ({ success: true }),
          all: async () => []
        })
      })
    };
  }

  // Broadcast message to all connected clients
  protected broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.connections.forEach(connection => {
      try {
        if (connection.readyState === 1) { // WebSocket.OPEN
          connection.send(messageStr);
        }
      } catch (error) {
        console.error('Failed to send message to connection:', error);
      }
    });
  }

  // Schedule a task
  protected async schedule(methodName: string, payload: any, options?: { delay?: number }): Promise<void> {
    // In a real implementation, this would integrate with Cloudflare Workflows
    if (options?.delay) {
      setTimeout(() => {
        if (typeof (this as any)[methodName] === 'function') {
          (this as any)[methodName](...Object.values(payload));
        }
      }, options.delay);
    }
  }

  // Add WebSocket connection
  protected addConnection(ws: any): void {
    this.connections.add(ws);
  }

  // Remove WebSocket connection
  protected removeConnection(ws: any): void {
    this.connections.delete(ws);
  }
}