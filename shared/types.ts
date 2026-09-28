/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Shared Types & Data Models
 */

export type SeverityLevel = 'INFORMATION' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type EventType =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'HEAVY_RAIN'
  | 'STORM'
  | 'THUNDERSTORM'
  | 'PM25'
  | 'AIR_POLLUTION'
  | 'HEAT'
  | 'WILDFIRE'
  | 'TSUNAMI'
  | 'HIGH_WAVES'
  | 'OTHER';

export type EventStatus = 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'CANCELLED';

export interface AIAnalysisResult {
  severity: SeverityLevel;
  summary: string;
  fact: string;
  analysis: string;
  recommendations: string[];
  affectedAreas: string[];
  vulnerableGroups: string[];
  urgency: 'IMMEDIATE' | 'HIGH' | 'MODERATE' | 'LOW';
  confidence: number; // 0.0 - 1.0
  analyzedAt: string;
}

export interface NormalizedEvent {
  id: string;
  fingerprint: string;
  type: EventType;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: EventStatus;
  latitude: number;
  longitude: number;
  province: string;
  district?: string;
  magnitude?: number;
  depth?: number;
  waterLevelMeters?: number;
  pm25Value?: number;
  windSpeedKmh?: number;
  rainfallMm?: number;
  occurredAt: string;
  detectedAt: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  isDemo?: boolean;
  aiAnalysis?: AIAnalysisResult;
}

export interface WeatherObservationData {
  province: string;
  provinceEn: string;
  stationName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  rainMmPerHour: number;
  condition: string;
  recordedAt: string;
}

export interface EarthquakeData {
  id: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  place: string;
  distanceToThailandKm: number;
  nearestThaiProvince: string;
  occurredAt: string;
  source: string;
  sourceUrl: string;
}

export interface FloodStationData {
  stationId: string;
  stationName: string;
  river: string;
  basin: string;
  province: string;
  latitude: number;
  longitude: number;
  waterLevelM: number;
  bankLevelM: number;
  capacityPercent: number;
  status: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL' | 'OVERFLOW';
  recordedAt: string;
}

export interface AirQualityData {
  province: string;
  stationName: string;
  latitude: number;
  longitude: number;
  pm25: number;
  pm10?: number;
  aqi: number;
  statusText: string;
  colorCode: string;
  recordedAt: string;
}

export interface StormData {
  id: string;
  name: string;
  category: string;
  maxWindSpeedKmh: number;
  centralPressureHpa: number;
  currentLat: number;
  currentLon: number;
  distanceToThailandKm: number;
  forecastTrack: Array<{ lat: number; lon: number; time: string; intensity: string }>;
  active: boolean;
}

export interface SystemHealthStatus {
  database: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  databaseType?: 'SQLite' | 'PostgreSQL';
  cacheQueueType?: 'In-Memory' | 'Redis';
  mode?: 'Development' | 'Production';
  isDevMode?: boolean;
  redis: 'ONLINE' | 'STANDALONE_FALLBACK' | 'OFFLINE';
  discordBot: 'ONLINE' | 'STANDBY_WEBHOOK' | 'OFFLINE';
  geminiAI: 'ONLINE' | 'OFFLINE' | 'NO_KEY';
  weatherApi: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  earthquakeApi: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  airQualityApi: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  floodApi: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  uptimeSeconds: number;
  lastSyncAt: string;
  activeEventsCount: number;
  totalEventsToday: number;
}

export interface DataProviderStatus {
  id: string;
  name: string;
  type: EventType;
  category: 'Weather' | 'Earthquake' | 'Flood' | 'Air Quality' | 'Storm';
  sourceUrl: string;
  isEnabled: boolean;
  pollIntervalMs: number;
  lastRunAt: string | null;
  lastStatus: 'OK' | 'ERROR' | 'IDLE';
  lastError?: string;
  eventsDiscovered: number;
}

export interface DiscordChannelSetting {
  id: string;
  channelId: string;
  channelName: string;
  webhookUrl: string;
  subscribedTypes: EventType[];
  minSeverity: SeverityLevel;
  filterProvinces: string[];
  isActive: boolean;
}

export interface SituationalSummary {
  updatedAt: string;
  criticalCount: number;
  warningCount: number;
  watchCount: number;
  infoCount: number;
  headlineTh: string;
  situationOverviewTh: string;
  priorityZonesTh: string[];
  safetyDirectivesTh: string[];
  rawStats: {
    totalActive: number;
    provincesImpacted: number;
  };
}

// Major Thailand Province Geo Data
export const THAILAND_PROVINCES: Record<string, { lat: number; lon: number; region: string; nameEn: string }> = {
  'กรุงเทพมหานคร': { lat: 13.7563, lon: 100.5018, region: 'Central', nameEn: 'Bangkok' },
  'เชียงใหม่': { lat: 18.7883, lon: 98.9853, region: 'North', nameEn: 'Chiang Mai' },
  'เชียงราย': { lat: 19.9105, lon: 99.8406, region: 'North', nameEn: 'Chiang Rai' },
  'แม่ฮ่องสอน': { lat: 19.3021, lon: 97.9654, region: 'North', nameEn: 'Mae Hong Son' },
  'ลำปาง': { lat: 18.2888, lon: 99.4928, region: 'North', nameEn: 'Lampang' },
  'น่าน': { lat: 18.7838, lon: 100.7782, region: 'North', nameEn: 'Nan' },
  'พิษณุโลก': { lat: 16.8211, lon: 100.2659, region: 'North', nameEn: 'Phitsanulok' },
  'ขอนแก่น': { lat: 16.4322, lon: 102.8236, region: 'Northeast', nameEn: 'Khon Kaen' },
  'นครราชสีมา': { lat: 14.9799, lon: 102.0978, region: 'Northeast', nameEn: 'Nakhon Ratchasima' },
  'อุดรธานี': { lat: 17.4138, lon: 102.7872, region: 'Northeast', nameEn: 'Udon Thani' },
  'อุบลราชธานี': { lat: 15.2448, lon: 104.8473, region: 'Northeast', nameEn: 'Ubon Ratchathani' },
  'พระนครศรีอยุธยา': { lat: 14.3532, lon: 100.5684, region: 'Central', nameEn: 'Ayutthaya' },
  'ชลบุรี': { lat: 13.3611, lon: 100.9847, region: 'East', nameEn: 'Chonburi' },
  'ระยอง': { lat: 12.6814, lon: 101.2816, region: 'East', nameEn: 'Rayong' },
  'กาญจนบุรี': { lat: 14.0228, lon: 99.5328, region: 'West', nameEn: 'Kanchanaburi' },
  'ภูเก็ต': { lat: 7.8804, lon: 98.3923, region: 'South', nameEn: 'Phuket' },
  'สุราษฎร์ธานี': { lat: 9.1382, lon: 99.3217, region: 'South', nameEn: 'Surat Thani' },
  'สงขลา': { lat: 7.1898, lon: 100.5954, region: 'South', nameEn: 'Songkhla' },
  'นครศรีธรรมราช': { lat: 8.4304, lon: 99.9631, region: 'South', nameEn: 'Nakhon Si Thammarat' },
  'ยะลา': { lat: 6.5411, lon: 101.2813, region: 'South', nameEn: 'Yala' },
  'นราธิวาส': { lat: 6.4255, lon: 101.8253, region: 'South', nameEn: 'Narathiwat' },
  'สระบุรี': { lat: 14.5289, lon: 100.9101, region: 'Central', nameEn: 'Saraburi' },
  'สมุทรปราการ': { lat: 13.5991, lon: 100.5968, region: 'Central', nameEn: 'Samut Prakan' },
  'นนทบุรี': { lat: 13.8621, lon: 100.5144, region: 'Central', nameEn: 'Nonthaburi' }
};

// Distance calculation utility (Haversine formula in KM)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Runtime object fallbacks for Node.js type stripping compatibility
export const AirQualityData = {} as any;
export const WeatherObservationData = {} as any;
export const EarthquakeData = {} as any;
export const FloodStationData = {} as any;
export const StormData = {} as any;
export const NormalizedEvent = {} as any;
export const AIAnalysisResult = {} as any;
export const SystemHealthStatus = {} as any;
export const DataProviderStatus = {} as any;
export const DiscordChannelSetting = {} as any;
export const SituationalSummary = {} as any;

