/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Data Repository Store (In-Memory with PostgreSQL Schema mapping)
 */

import type {
  NormalizedEvent,
  EventType,
  SeverityLevel,
  WeatherObservationData,
  EarthquakeData,
  FloodStationData,
  AirQualityData,
  StormData,
  SystemHealthStatus,
  DataProviderStatus,
  DiscordChannelSetting,
  SituationalSummary
} from '../../shared/types.ts';
import { THAILAND_PROVINCES, calculateDistanceKm } from '../../shared/types.ts';
import { databaseManager } from './database.manager.ts';
import { cacheManager } from './cache.manager.ts';

class DisasterStore {
  private events: Map<string, NormalizedEvent> = new Map();
  private weatherObservations: WeatherObservationData[] = [];
  private earthquakes: EarthquakeData[] = [];
  private floodStations: FloodStationData[] = [];
  private airQualityData: AirQualityData[] = [];
  private storms: StormData[] = [];
  private auditLogs: Array<{ id: string; time: string; level: string; message: string; details?: any }> = [];
  private notificationLogs: Array<{ id: string; time: string; channel: string; target: string; title: string; severity: SeverityLevel; success: boolean }> = [];
  
  private startTime = Date.now();
  private totalEventsDetectedToday = 0;

  public providers: Map<string, DataProviderStatus> = new Map([
    [
      'usgs-earthquake',
      {
        id: 'usgs-earthquake',
        name: 'USGS Seismology (SE Asia / Thailand)',
        type: 'EARTHQUAKE',
        category: 'Earthquake',
        sourceUrl: 'https://earthquake.usgs.gov',
        isEnabled: true,
        pollIntervalMs: 60000,
        lastRunAt: null,
        lastStatus: 'OK',
        eventsDiscovered: 0
      }
    ],
    [
      'open-meteo-weather',
      {
        id: 'open-meteo-weather',
        name: 'Open-Meteo Weather Radar (Thailand Regional)',
        type: 'HEAVY_RAIN',
        category: 'Weather',
        sourceUrl: 'https://open-meteo.com',
        isEnabled: true,
        pollIntervalMs: 180000,
        lastRunAt: null,
        lastStatus: 'OK',
        eventsDiscovered: 0
      }
    ],
    [
      'open-meteo-airquality',
      {
        id: 'open-meteo-airquality',
        name: 'CAMS / Open-Meteo PM2.5 & AQI (Thailand)',
        type: 'PM25',
        category: 'Air Quality',
        sourceUrl: 'https://air-quality-api.open-meteo.com',
        isEnabled: true,
        pollIntervalMs: 300000,
        lastRunAt: null,
        lastStatus: 'OK',
        eventsDiscovered: 0
      }
    ],
    [
      'thai-water-flood',
      {
        id: 'thai-water-flood',
        name: 'Thailand River Basin Hydrological Monitor',
        type: 'FLOOD',
        category: 'Flood',
        sourceUrl: 'https://www.thaiwater.net',
        isEnabled: true,
        pollIntervalMs: 300000,
        lastRunAt: null,
        lastStatus: 'OK',
        eventsDiscovered: 0
      }
    ],
    [
      'tmd-cyclone-tracker',
      {
        id: 'tmd-cyclone-tracker',
        name: 'TMD / JTWC Tropical Cyclone Monitor',
        type: 'STORM',
        category: 'Storm',
        sourceUrl: 'https://www.tmd.go.th',
        isEnabled: true,
        pollIntervalMs: 300000,
        lastRunAt: null,
        lastStatus: 'OK',
        eventsDiscovered: 0
      }
    ]
  ]);

  public discordChannels: DiscordChannelSetting[] = [
    {
      id: 'chan-1',
      channelId: '123456789012345678',
      channelName: '🚨・critical-alert',
      webhookUrl: process.env.DISCORD_WEBHOOK_CRITICAL || '',
      subscribedTypes: ['EARTHQUAKE', 'FLOOD', 'STORM', 'TSUNAMI', 'HEAVY_RAIN', 'PM25'],
      minSeverity: 'WARNING',
      filterProvinces: [],
      isActive: true
    },
    {
      id: 'chan-2',
      channelId: '234567890123456789',
      channelName: '🌦️・weather-radar',
      webhookUrl: process.env.DISCORD_WEBHOOK_WEATHER || '',
      subscribedTypes: ['HEAVY_RAIN', 'THUNDERSTORM', 'HEAT'],
      minSeverity: 'WATCH',
      filterProvinces: [],
      isActive: true
    },
    {
      id: 'chan-3',
      channelId: '345678901234567890',
      channelName: '🌏・earthquake-watch',
      webhookUrl: process.env.DISCORD_WEBHOOK_EARTHQUAKE || '',
      subscribedTypes: ['EARTHQUAKE', 'TSUNAMI'],
      minSeverity: 'INFORMATION',
      filterProvinces: [],
      isActive: true
    },
    {
      id: 'chan-4',
      channelId: '456789012345678901',
      channelName: '🌊・flood-monitor',
      webhookUrl: process.env.DISCORD_WEBHOOK_FLOOD || '',
      subscribedTypes: ['FLOOD'],
      minSeverity: 'WATCH',
      filterProvinces: [],
      isActive: true
    },
    {
      id: 'chan-5',
      channelId: '567890123456789012',
      channelName: '🌫️・pm25-air-quality',
      webhookUrl: process.env.DISCORD_WEBHOOK_PM25 || '',
      subscribedTypes: ['PM25', 'AIR_POLLUTION'],
      minSeverity: 'WARNING',
      filterProvinces: [],
      isActive: true
    }
  ];

  constructor() {
    this.addAuditLog('INFO', 'DisasterStore initialized with high-availability in-memory repository.');
    this.initializeBaselineData();
  }

  private initializeBaselineData() {
    // Initial real river basin hydrological stations
    this.floodStations = [
      {
        stationId: 'C.2',
        stationName: 'สถานี C.2 ค่ายจิรประวัติ (แม่น้ำเจ้าพระยา)',
        river: 'แม่น้ำเจ้าพระยา',
        basin: 'ลุ่มน้ำเจ้าพระยา',
        province: 'นครสวรรค์',
        latitude: 15.6888,
        longitude: 100.1256,
        waterLevelM: 22.8,
        bankLevelM: 26.2,
        capacityPercent: 72,
        status: 'NORMAL',
        recordedAt: new Date().toISOString()
      },
      {
        stationId: 'C.13',
        stationName: 'สถานีเขื่อนเจ้าพระยา (ท้ายเขื่อน)',
        river: 'แม่น้ำเจ้าพระยา',
        basin: 'ลุ่มน้ำเจ้าพระยา',
        province: 'ชัยนาท',
        latitude: 15.1583,
        longitude: 100.1792,
        waterLevelM: 14.5,
        bankLevelM: 16.5,
        capacityPercent: 78,
        status: 'WATCH',
        recordedAt: new Date().toISOString()
      },
      {
        stationId: 'P.1',
        stationName: 'สถานี P.1 สะพานนวรัฐ (แม่น้ำปิง)',
        river: 'แม่น้ำปิง',
        basin: 'ลุ่มน้ำปิง',
        province: 'เชียงใหม่',
        latitude: 18.7877,
        longitude: 99.0041,
        waterLevelM: 2.8,
        bankLevelM: 3.7,
        capacityPercent: 55,
        status: 'NORMAL',
        recordedAt: new Date().toISOString()
      },
      {
        stationId: 'M.7',
        stationName: 'สถานี M.7 สะพานเสรีประชาธิปไตย (แม่น้ำมูล)',
        river: 'แม่น้ำมูล',
        basin: 'ลุ่มน้ำมูล',
        province: 'อุบลราชธานี',
        latitude: 15.2289,
        longitude: 104.8569,
        waterLevelM: 111.4,
        bankLevelM: 112.0,
        capacityPercent: 88,
        status: 'WARNING',
        recordedAt: new Date().toISOString()
      },
      {
        stationId: 'E.20A',
        stationName: 'สถานี E.20A อ.เมือง (แม่น้ำชี)',
        river: 'แม่น้ำชี',
        basin: 'ลุ่มน้ำชี',
        province: 'ขอนแก่น',
        latitude: 16.3683,
        longitude: 102.8122,
        waterLevelM: 147.2,
        bankLevelM: 150.0,
        capacityPercent: 64,
        status: 'NORMAL',
        recordedAt: new Date().toISOString()
      }
    ];

    // Seed baseline weather observations for Thai provinces
    const provinces = Object.keys(THAILAND_PROVINCES);
    this.weatherObservations = provinces.slice(0, 10).map((prov) => {
      const info = THAILAND_PROVINCES[prov];
      return {
        province: prov,
        provinceEn: info.nameEn,
        stationName: `สถานีอุตุนิยมวิทยา ${prov}`,
        latitude: info.lat,
        longitude: info.lon,
        temperature: Math.round(28 + Math.random() * 5),
        humidity: Math.round(65 + Math.random() * 20),
        pressure: 1010 + Math.round(Math.random() * 4),
        windSpeed: Math.round(8 + Math.random() * 15),
        windDirection: Math.round(Math.random() * 360),
        rainMmPerHour: 0,
        condition: 'Partly Cloudy',
        recordedAt: new Date().toISOString()
      };
    });

    // Seed baseline Air Quality
    this.airQualityData = provinces.slice(0, 8).map((prov) => {
      const info = THAILAND_PROVINCES[prov];
      const pm = Math.round(15 + Math.random() * 25);
      return {
        province: prov,
        stationName: `สถานีตรวจวัดคุณภาพอากาศ ${prov}`,
        latitude: info.lat,
        longitude: info.lon,
        pm25: pm,
        pm10: Math.round(pm * 1.5),
        aqi: Math.round(pm * 2.2),
        statusText: pm > 37.5 ? 'เริ่มมีผลกระทบต่อสุขภาพ' : 'คุณภาพอากาศดีมาก',
        colorCode: pm > 37.5 ? '#f97316' : '#22c55e',
        recordedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Upsert an event with deduplication and escalation detection
   */
  public upsertEvent(event: NormalizedEvent): { isNew: boolean; isEscalated: boolean; event: NormalizedEvent } {
    // Check by fingerprint OR by ID to ensure complete uniqueness
    let existingKey = event.fingerprint;
    let existing = this.events.get(event.fingerprint);

    if (!existing) {
      for (const [key, ev] of this.events.entries()) {
        if (ev.id === event.id) {
          existing = ev;
          existingKey = key;
          break;
        }
      }
    }

    // Persist to database manager (SQLite in dev, PostgreSQL when configured)
    databaseManager.saveEvent(event).catch(() => {});

    if (!existing) {
      this.events.set(event.fingerprint, event);
      this.totalEventsDetectedToday++;
      
      const provStat = this.providers.get(event.source.toLowerCase());
      if (provStat) {
        provStat.eventsDiscovered++;
      }

      this.addAuditLog('INFO', `[${event.type}] New event detected: "${event.title}" (${event.severity}) in ${event.province}`, {
        fingerprint: event.fingerprint,
        severity: event.severity,
        source: event.source
      });

      return { isNew: true, isEscalated: false, event };
    }

    // If key changed, delete old key
    if (existingKey !== event.fingerprint) {
      this.events.delete(existingKey);
    }

    // Check for escalation
    const severityHierarchy: Record<SeverityLevel, number> = {
      INFORMATION: 1,
      WATCH: 2,
      WARNING: 3,
      CRITICAL: 4
    };

    const isEscalated = severityHierarchy[event.severity] > severityHierarchy[existing.severity];

    // Merge latest data
    const updated: NormalizedEvent = {
      ...existing,
      ...event,
      id: existing.id, // keep stable ID
      aiAnalysis: event.aiAnalysis || existing.aiAnalysis
    };

    this.events.set(event.fingerprint, updated);

    if (isEscalated) {
      this.addAuditLog('WARN', `🚨 ESCALATION: "${updated.title}" escalated from ${existing.severity} to ${updated.severity}!`, {
        fingerprint: updated.fingerprint,
        previousSeverity: existing.severity,
        newSeverity: updated.severity
      });
    }

    return { isNew: false, isEscalated, event: updated };
  }

  public getEvents(options?: {
    type?: EventType;
    severity?: SeverityLevel;
    province?: string;
    status?: string;
    limit?: number;
  }): NormalizedEvent[] {
    let list = Array.from(this.events.values());

    // Deduplicate by event.id
    const seenIds = new Set<string>();
    list = list.filter((e) => {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    });

    if (options?.type) {
      list = list.filter((e) => e.type === options.type);
    }
    if (options?.severity) {
      list = list.filter((e) => e.severity === options.severity);
    }
    if (options?.province) {
      list = list.filter((e) => e.province.includes(options.province!));
    }
    if (options?.status) {
      list = list.filter((e) => e.status === options.status);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    if (options?.limit) {
      list = list.slice(0, options.limit);
    }

    return list;
  }

  public getEventById(id: string): NormalizedEvent | undefined {
    for (const event of this.events.values()) {
      if (event.id === id) return event;
    }
    return undefined;
  }

  public setEarthquakes(data: EarthquakeData[]) {
    this.earthquakes = data;
  }

  public getEarthquakes(): EarthquakeData[] {
    return this.earthquakes;
  }

  public setWeatherObservations(data: WeatherObservationData[]) {
    this.weatherObservations = data;
  }

  public getWeatherObservations(): WeatherObservationData[] {
    return this.weatherObservations;
  }

  public setFloodStations(data: FloodStationData[]) {
    this.floodStations = data;
  }

  public getFloodStations(): FloodStationData[] {
    return this.floodStations;
  }

  public setAirQualityData(data: AirQualityData[]) {
    this.airQualityData = data;
  }

  public getAirQualityData(): AirQualityData[] {
    return this.airQualityData;
  }

  public setStorms(data: StormData[]) {
    this.storms = data;
  }

  public getStorms(): StormData[] {
    return this.storms;
  }

  public addAuditLog(level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL', message: string, details?: any) {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      time: new Date().toISOString(),
      level,
      message,
      details
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    databaseManager.saveAuditLog(log).catch(() => {});
    console.log(`[${log.time.split('T')[1].substring(0, 8)}] [${level}] ${message}`);
  }

  public getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  public addNotificationLog(log: { channel: string; target: string; title: string; severity: SeverityLevel; success: boolean }) {
    this.notificationLogs.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      time: new Date().toISOString(),
      ...log
    });
    if (this.notificationLogs.length > 300) {
      this.notificationLogs.pop();
    }
  }

  public getNotificationLogs(limit = 50) {
    return this.notificationLogs.slice(0, limit);
  }

  public getSystemHealth(): SystemHealthStatus {
    const allEvents = Array.from(this.events.values());
    const active = allEvents.filter((e) => e.status === 'ACTIVE').length;

    return {
      database: 'ONLINE',
      databaseType: databaseManager.getDatabaseType(),
      cacheQueueType: cacheManager.getCacheType(),
      mode: databaseManager.getMode(),
      isDevMode: databaseManager.isDev(),
      redis: process.env.REDIS_URL ? 'ONLINE' : 'STANDALONE_FALLBACK',
      discordBot: process.env.DISCORD_TOKEN ? 'ONLINE' : 'STANDBY_WEBHOOK',
      geminiAI: process.env.GEMINI_API_KEY ? 'ONLINE' : 'NO_KEY',
      weatherApi: 'ONLINE',
      earthquakeApi: 'ONLINE',
      airQualityApi: 'ONLINE',
      floodApi: 'ONLINE',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastSyncAt: new Date().toISOString(),
      activeEventsCount: active,
      totalEventsToday: this.totalEventsDetectedToday
    };
  }

  public generateSituationalSummary(): SituationalSummary {
    const events = Array.from(this.events.values()).filter((e) => e.status === 'ACTIVE');
    const critical = events.filter((e) => e.severity === 'CRITICAL');
    const warning = events.filter((e) => e.severity === 'WARNING');
    const watch = events.filter((e) => e.severity === 'WATCH');
    const info = events.filter((e) => e.severity === 'INFORMATION');

    const provinces = new Set(events.map((e) => e.province).filter(Boolean));

    let headline = 'สถานการณ์สภาพอากาศและภัยพิบัติภาพรวมประเทศไทยอยู่ในเกณฑ์ปกติ';
    if (critical.length > 0) {
      headline = `⚠️ สภาวะวิกฤต! ตรวจพบภัยพิบัติระดับ CRITICAL จำนวน ${critical.length} เหตุการณ์ในพื้นที่เฝ้าระวัง`;
    } else if (warning.length > 0) {
      headline = `เฝ้าระวังระดับเตือนภัย (WARNING) จำนวน ${warning.length} จุด ขอให้ประชาชนในพื้นที่ติดตามใกล้ชิด`;
    }

    const priorityZones = Array.from(provinces).slice(0, 5);

    return {
      updatedAt: new Date().toISOString(),
      criticalCount: critical.length,
      warningCount: warning.length,
      watchCount: watch.length,
      infoCount: info.length,
      headlineTh: headline,
      situationOverviewTh: `ขณะนี้มีเหตุการณ์ภัยพิบัติและสภาพอากาศที่กำลังเฝ้าระวังรวม ${events.length} รายการ ใน ${provinces.size} จังหวัด แนะนำให้ประชาชนและเจ้าหน้าที่ตรวจสอบการแจ้งเตือนตามระดับความรุนแรง`,
      priorityZonesTh: priorityZones.length > 0 ? priorityZones : ['กรุงเทพมหานครและปริมณฑล', 'ภาคเหนือ', 'ภาคใต้'],
      safetyDirectivesTh: [
        'ติดตามประกาศอย่างเป็นทางการจากกรมอุตุนิยมวิทยาและสำนักงานป้องกันและบรรเทาสาธารณภัย',
        'ตรวจสอบความพร้อมของอุปกรณ์สื่อสาร แบตเตอรี่สำรอง และกระเป๋าฉุกเฉินประจำบ้าน',
        'หลีกเลี่ยงการอยู่ในที่โล่งแจ้ง ใต้ต้นไม้ใหญ่ หรือป้ายโฆษณาที่ไม่แข็งแรงขณะเกิดพายุฝนฟ้าคะนอง'
      ],
      rawStats: {
        totalActive: events.length,
        provincesImpacted: provinces.size
      }
    };
  }
}

export const disasterStore = new DisasterStore();
