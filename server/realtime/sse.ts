/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Real-time Server-Sent Events (SSE) Manager
 */

import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  connectedAt: Date;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  public registerClient(id: string, res: Response) {
    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const client: SSEClient = {
      id,
      res,
      connectedAt: new Date()
    };

    this.clients.set(id, client);

    // Initial connection acknowledgment
    this.sendToClient(client, 'connected', {
      clientId: id,
      serverTime: new Date().toISOString(),
      activeClientsCount: this.clients.size
    });

    // Remove client on connection close
    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  public broadcast(eventName: string, data: any) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(payload);
      } catch (err) {
        this.clients.delete(id);
      }
    }
  }

  private sendToClient(client: SSEClient, eventName: string, data: any) {
    try {
      client.res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      this.clients.delete(client.id);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', { timestamp: Date.now() });
    }, 15000);
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
