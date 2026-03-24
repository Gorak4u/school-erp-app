// Simple WebSocket server implementation for demonstration
// In production, this would be a proper WebSocket server using Socket.io or ws library

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  schoolId?: string;
}

export class SimpleWebSocketServer {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // schoolId -> connectionIds

  constructor() {
    // Initialize with empty connections
  }

  // Simulate WebSocket connection (for demo purposes)
  connect(connectionId: string, schoolId?: string): WebSocket {
    // In a real implementation, this would be an actual WebSocket connection
    const mockWebSocket = {
      readyState: WebSocket.OPEN,
      send: (data: string) => {
        console.log('WebSocket send:', data);
        // Parse and handle the message
        try {
          const message = JSON.parse(data);
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      },
      close: () => {
        this.disconnect(connectionId);
      },
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    this.connections.set(connectionId, mockWebSocket);
    
    if (schoolId) {
      if (!this.subscriptions.has(schoolId)) {
        this.subscriptions.set(schoolId, new Set());
      }
      this.subscriptions.get(schoolId)!.add(connectionId);
    }

    console.log(`WebSocket connected: ${connectionId} for school: ${schoolId}`);
    return mockWebSocket;
  }

  disconnect(connectionId: string) {
    this.connections.delete(connectionId);
    
    // Remove from subscriptions
    for (const [schoolId, connectionIds] of this.subscriptions.entries()) {
      connectionIds.delete(connectionId);
      if (connectionIds.size === 0) {
        this.subscriptions.delete(schoolId);
      }
    }
    
    console.log(`WebSocket disconnected: ${connectionId}`);
  }

  private handleMessage(connectionId: string, message: WebSocketMessage) {
    console.log('Received message:', message);
    
    if (message.type === 'subscribe' && message.data.schoolId) {
      // Add connection to school subscription
      const schoolId = message.data.schoolId;
      if (!this.subscriptions.has(schoolId)) {
        this.subscriptions.set(schoolId, new Set());
      }
      this.subscriptions.get(schoolId)!.add(connectionId);
      console.log(`Connection ${connectionId} subscribed to school ${schoolId}`);
    }
  }

  // Broadcast message to all connections for a specific school
  broadcastToSchool(schoolId: string, message: WebSocketMessage) {
    const connectionIds = this.subscriptions.get(schoolId);
    if (!connectionIds) return;

    const messageStr = JSON.stringify(message);
    
    connectionIds.forEach(connectionId => {
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Simulate receiving message on client side
        console.log(`Broadcasting to ${connectionId}:`, message);
        
        // In a real implementation, this would send the actual message
        // For demo, we'll trigger a custom event
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: { message, connectionId }
        }));
      }
    });
  }

  // Broadcast to all connections
  broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    
    this.connections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`Broadcasting to ${connectionId}:`, message);
        
        // In a real implementation, this would send the actual message
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: { message, connectionId }
        }));
      }
    });
  }

  // Get connection count
  getConnectionCount(): number {
    return this.connections.size;
  }

  // Get subscriptions count
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Global WebSocket server instance
export const wsServer = new SimpleWebSocketServer();

// Helper functions for fines notifications
export const notifyFineCreated = (schoolId: string, fineData: any) => {
  wsServer.broadcastToSchool(schoolId, {
    type: 'fine_created',
    data: fineData,
    timestamp: Date.now(),
    schoolId
  });
};

export const notifyFineUpdated = (schoolId: string, fineData: any) => {
  wsServer.broadcastToSchool(schoolId, {
    type: 'fine_updated',
    data: fineData,
    timestamp: Date.now(),
    schoolId
  });
};

export const notifyWaiverRequested = (schoolId: string, waiverData: any) => {
  wsServer.broadcastToSchool(schoolId, {
    type: 'waiver_requested',
    data: waiverData,
    timestamp: Date.now(),
    schoolId
  });
};

export const notifyWaiverApproved = (schoolId: string, waiverData: any) => {
  wsServer.broadcastToSchool(schoolId, {
    type: 'waiver_approved',
    data: waiverData,
    timestamp: Date.now(),
    schoolId
  });
};

export const notifyWaiverRejected = (schoolId: string, waiverData: any) => {
  wsServer.broadcastToSchool(schoolId, {
    type: 'waiver_rejected',
    data: waiverData,
    timestamp: Date.now(),
    schoolId
  });
};
