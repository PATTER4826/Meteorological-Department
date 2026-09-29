/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * USGS Earthquake Data Provider
 */

import type { DisasterDataProvider, DataFetchResult } from './provider.interface.ts';
import type { NormalizedEvent, EarthquakeData, SeverityLevel } from '../../shared/types.ts';
import { THAILAND_PROVINCES, calculateDistanceKm } from '../../shared/types.ts';
import { AlertRuleEngine } from '../rules/alert-rules.engine.ts';

export class EarthquakeProvider implements DisasterDataProvider {
  readonly id = 'usgs-earthquake';
  readonly name = 'USGS Seismology (SE Asia / Thailand)';
  readonly category = 'Earthquake';
  readonly sourceUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  isEnabled = true;
  pollIntervalMs = 60000; // 60 seconds

  async fetchData(): Promise<DataFetchResult> {
    const events: NormalizedEvent[] = [];
    const observations: EarthquakeData[] = [];

    try {
      // Query recent 3 days of earthquakes with magnitude >= 2.5 in Indo-China / SE Asia region
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
      const startTime = threeDaysAgo.toISOString();

      // Bounding box roughly covering SE Asia / Bay of Bengal / Andaman / Myanmar / Laos / Vietnam / Thailand
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&minmagnitude=2.5&minlatitude=-2&maxlatitude=28&minlongitude=88&maxlongitude=115&limit=40`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`USGS API responded with HTTP ${response.status}`);
      }

      const json = await response.json();
      const features = json.features || [];

      for (const feat of features) {
        const props = feat.properties;
        const geom = feat.geometry;
        if (!props || !geom || geom.type !== 'Point') continue;

        const lon = geom.coordinates[0];
        const lat = geom.coordinates[1];
        const depth = geom.coordinates[2] || 10;
        const mag = props.mag || 0;
        const place = props.place || 'Unknown Location';
        const time = new Date(props.time).toISOString();
        const sourceUrl = props.url || 'https://earthquake.usgs.gov';
        const eventId = feat.id || `eq-${props.time}`;

        // Find nearest Thai province and distance
        let nearestProvince = 'เชียงราย';
        let minDistanceKm = 99999;

        for (const [provName, info] of Object.entries(THAILAND_PROVINCES)) {
          const dist = calculateDistanceKm(lat, lon, info.lat, info.lon);
          if (dist < minDistanceKm) {
            minDistanceKm = dist;
            nearestProvince = provName;
          }
        }

        const obs: EarthquakeData = {
          id: eventId,
          magnitude: mag,
          depth,
          latitude: lat,
          longitude: lon,
          place,
          distanceToThailandKm: minDistanceKm,
          nearestThaiProvince: nearestProvince,
          occurredAt: time,
          source: 'USGS Seismology',
          sourceUrl
        };
        observations.push(obs);

        // Determine severity using centralized AlertRuleEngine
        const ruleRes = AlertRuleEngine.evaluateEarthquake(mag, minDistanceKm, depth);
        const severity = ruleRes.severity;
        const shouldAlert = minDistanceKm <= 1000 && (severity !== 'INFORMATION' || mag >= 3.5);

        // Only create alertable events for items within radius of interest
        if (shouldAlert) {
          const isDirectThailand = minDistanceKm <= 80;
          const locationDescription = isDirectThailand
            ? `พื้นที่ จ.${nearestProvince}`
            : `${place} (ห่างจาก จ.${nearestProvince} ราว ${minDistanceKm} กม.)`;

          const normalized: NormalizedEvent = {
            id: `eq-${eventId}`,
            fingerprint: `EARTHQUAKE_${eventId}`,
            type: 'EARTHQUAKE',
            title: `แผ่นดินไหวขนาด M ${mag.toFixed(1)} ${locationDescription}`,
            description: `ตรวจพบแผ่นดินไหวขนาด ${mag.toFixed(1)} ลึก ${depth} กม. จุดศูนย์กลาง ${place} ห่างจากประเทศไทย (จ.${nearestProvince}) ประมาณ ${minDistanceKm} กม.`,
            severity,
            status: 'ACTIVE',
            latitude: lat,
            longitude: lon,
            province: nearestProvince,
            magnitude: mag,
            depth,
            occurredAt: time,
            detectedAt: new Date().toISOString(),
            source: 'USGS Seismology',
            sourceUrl,
            confidence: 0.99
          };
          events.push(normalized);
        }
      }

      return {
        events,
        observations,
        rawCount: features.length
      };
    } catch (err: any) {
      return {
        events: [],
        errors: [err.message || 'Failed to fetch USGS earthquakes'],
        rawCount: 0
      };
    }
  }
}
