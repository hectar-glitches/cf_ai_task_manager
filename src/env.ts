// Environment interface for Cloudflare Workers
export interface Env {
  TASK_MANAGER_AGENT: DurableObjectNamespace;
  AI: {
    run: (model: string, options: any) => Promise<any>;
  };
  WORKFLOWS: any;
}

// Extending the Agent base class functionality
declare global {
  interface DurableObjectState {
    // Cloudflare Durable Object state interface
  }

  interface WebSocket {
    accept(): void;
    send(message: string): void;
    close(code?: number, reason?: string): void;
  }
}

export interface DurableObjectNamespace {
  get(id: DurableObjectId): DurableObjectStub;
  idFromName(name: string): DurableObjectId;
  idFromString(hexId: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
}

export interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

// Console is available globally in Workers environment