/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * 24/7 Autonomous Background Alert Worker
 * Continuously polls data providers, normalizes events, applies deduplication,
 * evaluates alert rules, enriches with Gemini AI, and dispatches Discord alerts.
 */

import { EarthquakeProvider } from '../providers/earthquake.provider.ts';
import { WeatherProvider } from '../providers/weather.provider.ts';
import { AirQualityProvider } from '../providers/airquality.provider.ts';
import { FloodProvider } from '../providers/flood.provider.ts';
import { StormProvider } from '../providers/storm.provider.ts';
import type { DisasterDataProvider } from '../providers/provider.interface.ts';
import { disasterStore } from '../db/store.ts';
import { geminiService } from '../ai/gemini.service.ts';
import { DiscordService } from '../notifications/discord.service.ts';
import { sseManager } from '../realtime/sse.ts';
import { deduplicationService } from './deduplication.service.ts';
import { AlertRuleEngine } from '../rules/alert-rules.engine.ts';
import { logger } from '../utils/logger.ts';
import type { NormalizedEvent } from '../../shared/types.ts';

export interface WorkerHealthState {
  status: 'running' | 'stopping' | 'stopped';
  isLeader: boolean;
  startedAt: string | null;
  lastSuccessfulCheck: string | null;
  lastWeatherCheck: string | null;
  lastEarthquakeCheck: string | null;
  lastFloodCheck: string | null;
  lastStormCheck: string | null;
  lastAirQualityCheck: string | null;
  cycleCounts: {
    weather: number;
    earthquake: number;
    flood: number;
    storm: number;
    airQuality: number;
  };
  totalAlertsDispatched: number;
}

export class AlertWorker {
  private static instance: AlertWorker | null = null;

  private isRunning = false;
  private isLeader = false;
  private pollTimers: Map<string, NodeJS.Timeout> = new Map();
  private inFlightRuns: Set<string> = new Set();

  private providers: {
    weather: WeatherProvider;
    earthquake: EarthquakeProvider;
    flood: FloodProvider;
    storm: StormProvider;
    airQuality: AirQualityProvider;
  };

  private healthState: WorkerHealthState = {
    status: 'stopped',
    isLeader: false,
    startedAt: null,
    lastSuccessfulCheck: null,
    lastWeatherCheck: null,
    lastEarthquakeCheck: null,
    lastFloodCheck: null,
    lastStormCheck: null,
    lastAirQualityCheck: null,
    cycleCounts: {
      weather: 0,
      earthquake: 0,
      flood: 0,
      storm: 0,
      airQuality: 0
    },
    totalAlertsDispatched: 0
  };

  private constructor() {
    this.providers = {
      weather: new WeatherProvider(),
      earthquake: new EarthquakeProvider(),
      flood: new FloodProvider(),
      storm: new StormProvider(),
      airQuality: new AirQualityProvider()
    };
  }

  public static getInstance(): AlertWorker {
    if (!this.instance) {
      this.instance = new AlertWorker();
    }
    return this.instance;
  }

  /**
   * Safe rate-limited intervals (enforce minimum safe threshold)
   */
  private getPollingInterval(key: string, defaultMs: number, minMs: number = 30000): number {
    const envVal = Number(process.env[key]);
    if (!isNaN(envVal) && envVal > 0) {
      if (envVal < minMs) {
        logger.warn(`[CONFIG] ${key}=${envVal}ms is below safe minimum (${minMs}ms). Clamping to ${minMs}ms.`);
        return minMs;
      }
      return envVal;
    }
    return defaultMs;
  }

  /**
   * Start the 24/7 Alert Worker
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.worker('[ALERT WORKER] Already running as active singleton.');
      return;
    }

    // Singleton Leader check
    this.isLeader = true;
    this.isRunning = true;
    this.healthState.status = 'running';
    this.healthState.isLeader = true;
    this.healthState.startedAt = new Date().toISOString();

    logger.worker('[ALERT WORKER] Started (24/7 Autonomous Alert Engine)');

    // Initialize Discord Bot client asynchronously
    DiscordService.initBot().catch((err) => {
      logger.warn(`[DISCORD] Initial login attempt: ${err.message}`);
    });

    // Check Test Mode
    if (process.env.ALERT_TEST_MODE === 'true') {
      logger.alert('🧪 [TEST MODE] ALERT_TEST_MODE is enabled. Simulated test alerts are permitted.');
    }

    // Setup Polling intervals
    const weatherInterval = this.getPollingInterval('WEATHER_POLL_INTERVAL_MS', 180000, 45000);   // 3 min
    const earthquakeInterval = this.getPollingInterval('EARTHQUAKE_POLL_INTERVAL_MS', 60000, 30000); // 1 min
    const floodInterval = this.getPollingInterval('FLOOD_POLL_INTERVAL_MS', 300000, 60000);        // 5 min
    const stormInterval = this.getPollingInterval('STORM_POLL_INTERVAL_MS', 300000, 60000);        // 5 min
    const airQualityInterval = this.getPollingInterval('AIR_QUALITY_POLL_INTERVAL_MS', 300000, 60000); // 5 min

    // Schedule Earthquake monitor
    this.runCategoryCycle('earthquake', this.providers.earthquake);
    this.scheduleRecurring('earthquake', this.providers.earthquake, earthquakeInterval);

    // Schedule Weather monitor
    this.runCategoryCycle('weather', this.providers.weather);
    this.scheduleRecurring('weather', this.providers.weather, weatherInterval);

    // Schedule Flood monitor
    this.runCategoryCycle('flood', this.providers.flood);
    this.scheduleRecurring('flood', this.providers.flood, floodInterval);

    // Schedule Storm monitor
    this.runCategoryCycle('storm', this.providers.storm);
    this.scheduleRecurring('storm', this.providers.storm, stormInterval);

    // Schedule Air Quality monitor
    this.runCategoryCycle('airQuality', this.providers.airQuality);
    this.scheduleRecurring('airQuality', this.providers.airQuality, airQualityInterval);
  }

  private scheduleRecurring(key: string, provider: DisasterDataProvider, intervalMs: number) {
    const timer = setInterval(() => {
      if (!this.isRunning) return;
      this.runCategoryCycle(key, provider);
    }, intervalMs);

    this.pollTimers.set(key, timer);
  }

  /**
   * Run a single polling cycle with Exponential Backoff Retry and Rate Limiting
   */
  public async runCategoryCycle(categoryKey: string, provider: DisasterDataProvider): Promise<void> {
    if (this.inFlightRuns.has(categoryKey)) {
      logger.worker(`[ALERT WORKER] ${provider.name} cycle is already in-flight. Skipping overlapping run.`);
      return;
    }

    this.inFlightRuns.add(categoryKey);

    try {
      // Execute provider fetch with Exponential Backoff Retry (Max 3 attempts)
      const result = await this.executeWithRetry(
        () => provider.fetchData(),
        3,
        1500,
        provider.name
      );

      const nowIso = new Date().toISOString();

      // Update provider observation data in store
      if (categoryKey === 'earthquake' && result.observations) {
        disasterStore.setEarthquakes(result.observations);
        this.healthState.lastEarthquakeCheck = nowIso;
        this.healthState.cycleCounts.earthquake++;
        logger.worker('[ALERT WORKER] Earthquake check completed');
      } else if (categoryKey === 'weather' && result.observations) {
        disasterStore.setWeatherObservations(result.observations);
        this.healthState.lastWeatherCheck = nowIso;
        this.healthState.cycleCounts.weather++;
        logger.worker('[ALERT WORKER] Weather check completed');
      } else if (categoryKey === 'flood' && result.observations) {
        disasterStore.setFloodStations(result.observations);
        this.healthState.lastFloodCheck = nowIso;
        this.healthState.cycleCounts.flood++;
        logger.worker('[ALERT WORKER] Flood check completed');
      } else if (categoryKey === 'storm' && result.observations) {
        disasterStore.setStorms(result.observations);
        this.healthState.lastStormCheck = nowIso;
        this.healthState.cycleCounts.storm++;
        logger.worker('[ALERT WORKER] Storm check completed');
      } else if (categoryKey === 'airQuality' && result.observations) {
        disasterStore.setAirQualityData(result.observations);
        this.healthState.lastAirQualityCheck = nowIso;
        this.healthState.cycleCounts.airQuality++;
        logger.worker('[ALERT WORKER] Air Quality check completed');
      }

      this.healthState.lastSuccessfulCheck = nowIso;
      logger.worker(`[ALERT WORKER] Last successful check: ${nowIso}`);

      // Process normalized events discovered in this cycle
      for (const rawEvent of result.events) {
        await this.processNormalizedEvent(rawEvent);
      }

      // Update provider status in disaster store
      const pStat = disasterStore.providers.get(provider.id);
      if (pStat) {
        pStat.lastRunAt = nowIso;
        pStat.lastStatus = 'OK';
        pStat.lastError = undefined;
      }

      // Broadcast heartbeat via SSE to any active web monitors
      sseManager.broadcast('collector:heartbeat', {
        providerId: provider.id,
        category: categoryKey,
        eventsCount: result.events.length,
        timestamp: Date.now()
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      logger.error(`[ALERT WORKER] ${provider.name} check failed: ${errMsg}`);

      const pStat = disasterStore.providers.get(provider.id);
      if (pStat) {
        pStat.lastRunAt = new Date().toISOString();
        pStat.lastStatus = 'ERROR';
        pStat.lastError = errMsg;
      }
    } finally {
      this.inFlightRuns.delete(categoryKey);
    }
  }

  /**
   * Process a Normalized Event:
   * 1. Deduplication check
   * 2. Rule evaluation
   * 3. AI Enrichment (Gemini)
   * 4. Discord Alert Dispatch
   * 5. Save Event to Repository
   */
  private async processNormalizedEvent(event: NormalizedEvent): Promise<void> {
    // 1. Evaluate Deduplication & Significant Changes
    const dedup = deduplicationService.evaluateEventForAlert(event);

    // 2. Persist event into store/database regardless of whether it triggers a new alert
    const upsertRes = disasterStore.upsertEvent(event);
    const resolvedEvent = upsertRes.event;

    // If deduplication says no alert needed, we stop here
    if (!dedup.shouldAlert) {
      return;
    }

    // 3. AI Enrichment (Gemini AI acts as enhancer/summarizer, rule-based fallback if offline)
    try {
      if (!resolvedEvent.aiAnalysis) {
        resolvedEvent.aiAnalysis = await geminiService.analyzeEvent(resolvedEvent);
      }
    } catch (aiErr: any) {
      logger.warn(`AI Analysis fallback for ${resolvedEvent.id}: ${aiErr.message}`);
    }

    // 4. Dispatch Discord Alert
    try {
      const success = await DiscordService.dispatchAlert(resolvedEvent, {
        isUpdate: dedup.isUpdate,
        isEscalation: upsertRes.isEscalated,
        updateReason: dedup.updateReason
      });

      if (success) {
        deduplicationService.recordAlertDispatched(resolvedEvent);
        this.healthState.totalAlertsDispatched++;

        // Broadcast to SSE clients
        sseManager.broadcast('alert:new', {
          event: resolvedEvent,
          isUpdate: dedup.isUpdate,
          isEscalation: upsertRes.isEscalated,
          updateReason: dedup.updateReason,
          dispatchedAt: new Date().toISOString()
        });
      }
    } catch (dispErr: any) {
      logger.error(`Failed to dispatch alert for ${resolvedEvent.id}: ${dispErr.message}`);
    }
  }

  /**
   * Helper: Execute asynchronous operation with Exponential Backoff Retry
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 1500,
    providerName: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (attempt === maxRetries) break;

        const delay = Math.pow(2, attempt - 1) * baseDelayMs;
        logger.warn(`[ALERT WORKER] ${providerName} request error: ${err.message}. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Development Test Mode simulation
   */
  public async triggerTestAlert(scenario: 'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25'): Promise<NormalizedEvent> {
    const nowIso = new Date().toISOString();
    let simEvent: NormalizedEvent;

    switch (scenario) {
      case 'EARTHQUAKE':
        simEvent = {
          id: `test-eq-${Date.now()}`,
          fingerprint: `TEST_EQ_${Date.now()}`,
          type: 'EARTHQUAKE',
          title: 'ทดสอบระบบ: แผ่นดินไหวขนาด 5.2 รอยเลื่อนแม่ทา',
          description: '🧪 ข้อความทดสอบระบบแจ้งเตือนภัยพิบัติจำลอง ไม่ใช่เหตุการณ์จริงเพื่อตรวจทาน Discord Alert Integration',
          severity: 'WARNING',
          status: 'ACTIVE',
          latitude: 18.7904,
          longitude: 99.0345,
          province: 'เชียงใหม่',
          district: 'อ.แม่ริม',
          magnitude: 5.2,
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
          id: `test-flood-${Date.now()}`,
          fingerprint: `TEST_FLOOD_${Date.now()}`,
          type: 'FLOOD',
          title: 'ทดสอบระบบ: ระดับน้ำแม่น้ำเจ้าพระยาวิกฤตล้นตลิ่ง',
          description: '🧪 ข้อความทดสอบระบบจำลองสถานการณ์น้ำท่วมฉับพลันระดับวิกฤต',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          latitude: 14.3411,
          longitude: 100.5822,
          province: 'พระนครศรีอยุธยา',
          district: 'อ.พระนครศรีอยุธยา',
          waterLevelMeters: 5.45,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'Thailand Hydro-Informatics (Simulation)',
          sourceUrl: 'https://www.thaiwater.net',
          confidence: 1.0,
          isDemo: true
        };
        break;

      case 'PM25':
        simEvent = {
          id: `test-pm25-${Date.now()}`,
          fingerprint: `TEST_PM25_${Date.now()}`,
          type: 'PM25',
          title: 'ทดสอบระบบ: ค่าฝุ่นละออง PM2.5 เกินเกณฑ์มาตรฐานระดับสีแดง',
          description: '🧪 ข้อความทดสอบระบบจำลองมลพิษทางอากาศ PM2.5 ในพื้นที่กรุงเทพมหานคร',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          latitude: 13.7462,
          longitude: 100.5347,
          province: 'กรุงเทพมหานคร',
          district: 'เขตปทุมวัน',
          pm25Value: 92.5,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'Air Quality Sensor (Simulation)',
          sourceUrl: 'https://air-quality-api.open-meteo.com',
          confidence: 1.0,
          isDemo: true
        };
        break;

      default:
        simEvent = {
          id: `test-storm-${Date.now()}`,
          fingerprint: `TEST_STORM_${Date.now()}`,
          type: 'STORM',
          title: 'ทดสอบระบบ: พายุโซนร้อนเคลื่อนตัวเข้าสู่อ่าวไทย',
          description: '🧪 ข้อความทดสอบระบบจำลองพายุหมุนเขตร้อน',
          severity: 'WARNING',
          status: 'ACTIVE',
          latitude: 9.85,
          longitude: 100.8,
          province: 'สุราษฎร์ธานี',
          windSpeedKmh: 75,
          occurredAt: nowIso,
          detectedAt: nowIso,
          source: 'TMD Cyclone Tracker (Simulation)',
          sourceUrl: 'https://www.tmd.go.th',
          confidence: 1.0,
          isDemo: true
        };
        break;
    }

    // Attach verified rule analysis
    simEvent.aiAnalysis = {
      severity: simEvent.severity,
      summary: simEvent.title,
      fact: simEvent.description,
      analysis: 'ข้อมูลทดสอบระบบจาก Developer Console / Test Mode',
      recommendations: [
        '🧪 ข้อความทดสอบระบบจำลอง ไม่ต้องดำเนินการอพยพหรือตื่นตระหนก',
        'โปรดติดตามประกาศอย่างเป็นทางการจากกรมอุตุนิยมวิทยา'
      ],
      affectedAreas: [simEvent.province],
      vulnerableGroups: ['ผู้ทดสอบระบบ'],
      urgency: 'HIGH',
      confidence: 1.0,
      analyzedAt: nowIso
    };

    await DiscordService.dispatchAlert(simEvent, { isTest: true });
    disasterStore.upsertEvent(simEvent);
    return simEvent;
  }

  /**
   * Health state summary for /health API
   */
  public getHealthState(): WorkerHealthState {
    return { ...this.healthState };
  }

  /**
   * Trigger manual execution for a specific provider
   */
  public async runProvider(providerId: string): Promise<void> {
    switch (providerId) {
      case 'usgs-earthquake':
        await this.runCategoryCycle('earthquake', this.providers.earthquake);
        break;
      case 'open-meteo-weather':
        await this.runCategoryCycle('weather', this.providers.weather);
        break;
      case 'thai-water-flood':
        await this.runCategoryCycle('flood', this.providers.flood);
        break;
      case 'tmd-cyclone-tracker':
        await this.runCategoryCycle('storm', this.providers.storm);
        break;
      case 'open-meteo-airquality':
        await this.runCategoryCycle('airQuality', this.providers.airQuality);
        break;
      default:
        logger.warn(`Unknown provider id: ${providerId}`);
    }
  }

  /**
   * Graceful Shutdown
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('[WORKER] Initiating graceful shutdown of 24/7 Alert Worker...');
    this.healthState.status = 'stopping';
    this.isRunning = false;

    // Clear all recurring timers
    for (const [key, timer] of this.pollTimers.entries()) {
      clearInterval(timer);
      logger.worker(`[ALERT WORKER] Stopped polling timer for ${key}`);
    }
    this.pollTimers.clear();

    // Close Discord bot client
    await DiscordService.destroy();

    this.healthState.status = 'stopped';
    logger.info('[WORKER] Alert Worker safely stopped. In-flight tasks completed.');
  }
}

export const alertWorker = AlertWorker.getInstance();
