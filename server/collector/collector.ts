/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Central Data Collector & Scheduler
 */

import { EarthquakeProvider } from '../providers/earthquake.provider.ts';
import { WeatherProvider } from '../providers/weather.provider.ts';
import { AirQualityProvider } from '../providers/airquality.provider.ts';
import { FloodProvider } from '../providers/flood.provider.ts';
import { StormProvider } from '../providers/storm.provider.ts';
import type { DisasterDataProvider } from '../providers/provider.interface.ts';
import { disasterStore } from '../db/store.ts';
import { geminiService } from '../ai/gemini.service.ts';
import { notificationEngine } from '../notifications/notification.engine.ts';
import { sseManager } from '../realtime/sse.ts';
import type { NormalizedEvent } from '../../shared/types.ts';

class DataCollector {
  private providers: DisasterDataProvider[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    this.providers = [
      new EarthquakeProvider(),
      new WeatherProvider(),
      new AirQualityProvider(),
      new FloodProvider(),
      new StormProvider()
    ];
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    disasterStore.addAuditLog('INFO', 'Starting Central Data Collector with 5 automated providers.');

    // Run initial fetch for all providers
    for (const provider of this.providers) {
      this.executeProviderRun(provider);

      // Setup recurring schedule
      const interval = setInterval(() => {
        this.executeProviderRun(provider);
      }, provider.pollIntervalMs);

      this.timers.set(provider.id, interval);
    }
  }

  public stop() {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.isRunning = false;
    disasterStore.addAuditLog('WARN', 'Data Collector stopped.');
  }

  public async executeProviderRun(provider: DisasterDataProvider): Promise<void> {
    const storeStatus = disasterStore.providers.get(provider.id);
    if (storeStatus && !storeStatus.isEnabled) {
      return;
    }

    try {
      const startTime = Date.now();
      const result = await provider.fetchData();
      const durationMs = Date.now() - startTime;

      if (storeStatus) {
        storeStatus.lastRunAt = new Date().toISOString();
        storeStatus.lastStatus = result.errors && result.errors.length > 0 ? 'ERROR' : 'OK';
        storeStatus.lastError = result.errors ? result.errors.join('; ') : undefined;
      }

      // Update specialized observation datasets in store
      if (provider.id === 'usgs-earthquake' && result.observations) {
        disasterStore.setEarthquakes(result.observations);
      } else if (provider.id === 'open-meteo-weather' && result.observations) {
        disasterStore.setWeatherObservations(result.observations);
      } else if (provider.id === 'open-meteo-airquality' && result.observations) {
        disasterStore.setAirQualityData(result.observations);
      } else if (provider.id === 'thai-water-flood' && result.observations) {
        disasterStore.setFloodStations(result.observations);
      } else if (provider.id === 'tmd-cyclone-tracker' && result.observations) {
        disasterStore.setStorms(result.observations);
      }

      // Process normalized events
      for (const event of result.events) {
        await this.handleIncomingEvent(event);
      }

      // Notify SSE clients of refreshed system status
      sseManager.broadcast('collector:heartbeat', {
        providerId: provider.id,
        durationMs,
        eventsCount: result.events.length,
        timestamp: Date.now()
      });
    } catch (err: any) {
      disasterStore.addAuditLog('ERROR', `Collector run failed for provider ${provider.name}: ${err.message}`);
      if (storeStatus) {
        storeStatus.lastStatus = 'ERROR';
        storeStatus.lastError = err.message;
      }
    }
  }

  /**
   * Pipeline: Normalize -> Deduplicate -> AI Analysis -> Notify & Broadcast
   */
  public async handleIncomingEvent(event: NormalizedEvent): Promise<void> {
    // 1. Upsert and check deduplication / escalation
    const { isNew, isEscalated, event: storedEvent } = disasterStore.upsertEvent(event);

    if (isNew || isEscalated) {
      // 2. Perform AI Analysis with Gemini (preserves facts, enriches with impact and safety recommendations)
      try {
        const aiAnalysis = await geminiService.analyzeEvent(storedEvent);
        storedEvent.aiAnalysis = aiAnalysis;
        // If AI recommended escalation based on risk context
        if (aiAnalysis.severity === 'CRITICAL' && storedEvent.severity !== 'CRITICAL') {
          storedEvent.severity = 'CRITICAL';
        }
      } catch (err: any) {
        disasterStore.addAuditLog('WARN', `AI analysis fallback used for ${storedEvent.title}`);
      }

      // 3. Dispatch to Notification Engine (Anti-Spam + Discord + SSE Web Dashboard)
      await notificationEngine.processEventNotification(storedEvent, isEscalated);

      // 4. Real-time SSE broadcast
      sseManager.broadcast(isNew ? 'event:new' : 'event:update', storedEvent);
    }
  }

  /**
   * Test Mode / Simulation Generator with mandatory "⚠️ DEMO DATA" tags
   */
  public async triggerSimulation(scenario: 'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25'): Promise<NormalizedEvent> {
    const nowIso = new Date().toISOString();
    let simEvent: NormalizedEvent;

    switch (scenario) {
      case 'EARTHQUAKE':
        simEvent = {
          id: `demo-eq-${Date.now().toString().slice(-5)}`,
          fingerprint: `DEMO_EQ_${Date.now()}`,
          type: 'EARTHQUAKE',
          title: '⚠️ [DEMO DATA] แผ่นดินไหวขนาด M 6.2 อ.แม่ลาว จ.เชียงราย',
          description: '[ข้อมูลจำลองสำหรับการทดสอบระบบ] ตรวจพบแผ่นดินไหวขนาด 6.2 ความลึก 10 กม. รู้สึกสั่นไหวรุนแรงในหลายจังหวัดภาคเหนือ',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          latitude: 19.7892,
          longitude: 99.7214,
          province: 'เชียงราย',
          district: 'อ.แม่ลาว',
          magnitude: 6.2,
          depth: 10,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'USGS Seismology (Simulation)',
          sourceUrl: 'https://earthquake.usgs.gov',
          confidence: 1.0,
          isDemo: true
        };
        break;

      case 'FLOOD':
        simEvent = {
          id: `demo-flood-${Date.now().toString().slice(-5)}`,
          fingerprint: `DEMO_FLOOD_${Date.now()}`,
          type: 'FLOOD',
          title: '⚠️ [DEMO DATA] น้ำล้นตลิ่งแม่น้ำเจ้าพระยาเข้าท่วมพื้นที่ อ.บางบาล จ.พระนครศรีอยุธยา',
          description: '[ข้อมูลจำลองสำหรับการทดสอบระบบ] ปริมาณน้ำไหลผ่านเขื่อนเจ้าพระยาเกิน 2,800 ลบ.ม./วินาที ระดับน้ำล้นตลิ่งสูง 45 ซม.',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          latitude: 14.3644,
          longitude: 100.4856,
          province: 'พระนครศรีอยุธยา',
          district: 'อ.บางบาล',
          waterLevelMeters: 5.65,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'ThaiWater Telemetry (Simulation)',
          sourceUrl: 'https://www.thaiwater.net',
          confidence: 1.0,
          isDemo: true
        };
        break;

      case 'STORM':
        simEvent = {
          id: `demo-storm-${Date.now().toString().slice(-5)}`,
          fingerprint: `DEMO_STORM_${Date.now()}`,
          type: 'STORM',
          title: '⚠️ [DEMO DATA] พายุโซนร้อน "ซูลิก" กำลังเคลื่อนขึ้นฝั่งใกล้ จ.อุบลราชธานี',
          description: '[ข้อมูลจำลองสำหรับการทดสอบระบบ] พายุโซนร้อนความเร็วลมสูงสุดใกล้ศูนย์กลาง 75 กม./ชม. มีฝนตกหนักถึงหนักมากต่อเนื่อง',
          severity: 'WARNING',
          status: 'ACTIVE',
          latitude: 15.3524,
          longitude: 105.1235,
          province: 'อุบลราชธานี',
          windSpeedKmh: 75,
          rainfallMm: 85,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'TMD Tropical Cyclone (Simulation)',
          sourceUrl: 'https://www.tmd.go.th',
          confidence: 1.0,
          isDemo: true
        };
        break;

      case 'PM25':
      default:
        simEvent = {
          id: `demo-pm25-${Date.now().toString().slice(-5)}`,
          fingerprint: `DEMO_PM25_${Date.now()}`,
          type: 'PM25',
          title: '⚠️ [DEMO DATA] วิกฤตหมอกควันและฝุ่น PM2.5 ระดับสีแดง อ.เฉลิมพระเกียรติ จ.สระบุรี',
          description: '[ข้อมูลจำลองสำหรับการทดสอบระบบ] ค่า PM2.5 พุ่งสูงแตะ 128.4 µg/m³ เกินค่ามาตรฐานอย่างรุนแรง มีผลกระทบต่อสุขภาพ',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          latitude: 14.6542,
          longitude: 100.9125,
          province: 'สระบุรี',
          district: 'อ.เฉลิมพระเกียรติ',
          pm25Value: 128.4,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'PCD Air4Thai (Simulation)',
          sourceUrl: 'http://air4thai.pcd.go.th',
          confidence: 1.0,
          isDemo: true
        };
        break;
    }

    await this.handleIncomingEvent(simEvent);
    return simEvent;
  }
}

export const dataCollector = new DataCollector();
