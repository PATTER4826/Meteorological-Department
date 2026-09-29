/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Event Deduplication & Anti-Spam Service
 * Prevents repeat alerts while enabling significant update notifications.
 */

import type { NormalizedEvent } from '../../shared/types.ts';
import { AlertRuleEngine } from '../rules/alert-rules.engine.ts';
import { logger } from '../utils/logger.ts';

export interface AlertRecord {
  fingerprint: string;
  id: string;
  lastNotifiedAt: number;
  lastEvent: NormalizedEvent;
  notificationCount: number;
}

export class DeduplicationService {
  private alertHistory: Map<string, AlertRecord> = new Map();
  private suppressedDuplicatesCount = 0;
  private updatesDispatchedCount = 0;
  private readonly defaultCooldownMs = 30 * 60 * 1000; // 30 minutes anti-spam cooldown

  /**
   * Determine if an incoming normalized event should trigger an alert
   */
  public evaluateEventForAlert(event: NormalizedEvent): {
    shouldAlert: boolean;
    isUpdate: boolean;
    isNew: boolean;
    updateReason?: string;
    previousEvent?: NormalizedEvent;
  } {
    const existing = this.alertHistory.get(event.fingerprint);

    // 1. Brand new event
    if (!existing) {
      // Check if severity qualifies for alerting
      const qualifies = event.severity === 'CRITICAL' || event.severity === 'WARNING';
      return {
        shouldAlert: qualifies,
        isUpdate: false,
        isNew: true
      };
    }

    // 2. Previously seen event: Check for significant change
    const changeCheck = AlertRuleEngine.checkSignificantChange(existing.lastEvent, event);

    if (changeCheck.isSignificant) {
      this.updatesDispatchedCount++;
      return {
        shouldAlert: true,
        isUpdate: true,
        isNew: false,
        updateReason: changeCheck.reasonTh,
        previousEvent: existing.lastEvent
      };
    }

    // 3. Duplicate event without significant change
    const timeSinceLastAlert = Date.now() - existing.lastNotifiedAt;
    this.suppressedDuplicatesCount++;

    if (timeSinceLastAlert < this.defaultCooldownMs) {
      logger.worker(`[DEDUPLICATION] Suppressed duplicate alert for "${event.title}" (already sent ${Math.round(timeSinceLastAlert / 1000)}s ago)`);
    }

    return {
      shouldAlert: false,
      isUpdate: false,
      isNew: false
    };
  }

  /**
   * Record that an alert was dispatched for this event
   */
  public recordAlertDispatched(event: NormalizedEvent) {
    const existing = this.alertHistory.get(event.fingerprint);
    const count = existing ? existing.notificationCount + 1 : 1;

    this.alertHistory.set(event.fingerprint, {
      fingerprint: event.fingerprint,
      id: event.id,
      lastNotifiedAt: Date.now(),
      lastEvent: { ...event },
      notificationCount: count
    });
  }

  public getStats() {
    return {
      trackedEventsCount: this.alertHistory.size,
      suppressedDuplicatesCount: this.suppressedDuplicatesCount,
      updatesDispatchedCount: this.updatesDispatchedCount
    };
  }

  public clear() {
    this.alertHistory.clear();
  }
}

export const deduplicationService = new DeduplicationService();
