/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Central Notification Engine with Anti-Spam & Escalation Router
 */

import type { NormalizedEvent, SeverityLevel } from '../../shared/types.ts';
import { disasterStore } from '../db/store.ts';
import { DiscordService } from './discord.service.ts';
import { sseManager } from '../realtime/sse.ts';

class NotificationEngine {
  // Map fingerprint to last notified timestamp and severity
  private notifiedEvents: Map<string, { timestamp: number; severity: SeverityLevel }> = new Map();
  private readonly cooldownPeriodMs = 30 * 60 * 1000; // 30 minutes anti-spam window

  private readonly severityHierarchy: Record<SeverityLevel, number> = {
    INFORMATION: 1,
    WATCH: 2,
    WARNING: 3,
    CRITICAL: 4
  };

  /**
   * Process a newly detected or updated event
   */
  async processEventNotification(event: NormalizedEvent, isEscalation = false): Promise<void> {
    const existing = this.notifiedEvents.get(event.fingerprint);
    const now = Date.now();

    // Check anti-spam condition
    if (existing && !isEscalation) {
      const timeSinceLast = now - existing.timestamp;
      const currentSevRank = this.severityHierarchy[event.severity];
      const previousSevRank = this.severityHierarchy[existing.severity];

      // If within cooldown and severity has NOT increased, suppress
      if (timeSinceLast < this.cooldownPeriodMs && currentSevRank <= previousSevRank) {
        disasterStore.addAuditLog('INFO', `Anti-spam: notification suppressed for event "${event.title}" (sent ${Math.round(timeSinceLast / 1000)}s ago).`);
        return;
      }
    }

    // Record notification dispatch
    this.notifiedEvents.set(event.fingerprint, {
      timestamp: now,
      severity: event.severity
    });

    // 1. Broadcast to all Web Dashboard clients via SSE
    sseManager.broadcast('alert:new', {
      event,
      isEscalation,
      dispatchedAt: new Date().toISOString()
    });

    // 2. Dispatch to Discord Channels configured in the system
    await this.dispatchDiscordChannels(event, isEscalation);
  }

  private async dispatchDiscordChannels(event: NormalizedEvent, isEscalation: boolean): Promise<void> {
    const channels = disasterStore.discordChannels;
    const eventSevRank = this.severityHierarchy[event.severity];

    for (const channel of channels) {
      if (!channel.isActive || !channel.webhookUrl) continue;

      // Check event type subscription
      if (!channel.subscribedTypes.includes(event.type)) continue;

      // Check minimum severity
      const minRank = this.severityHierarchy[channel.minSeverity];
      if (eventSevRank < minRank && !isEscalation) continue;

      // Check province filter if configured
      if (channel.filterProvinces.length > 0 && !channel.filterProvinces.includes(event.province)) {
        continue;
      }

      // Send to webhook asynchronously with error protection
      try {
        await DiscordService.sendWebhook(channel.webhookUrl, event, isEscalation);
      } catch (err: any) {
        disasterStore.addAuditLog('ERROR', `Failed sending Discord webhook to channel ${channel.channelName}: ${err.message}`);
      }
    }
  }
}

export const notificationEngine = new NotificationEngine();
