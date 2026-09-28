/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Real Air Quality (PM2.5 & AQI) Provider
 */

import { DisasterDataProvider, DataFetchResult } from './provider.interface.ts';
import { NormalizedEvent, AirQualityData, SeverityLevel } from '../../shared/types.ts';

export class AirQualityProvider implements DisasterDataProvider {
  readonly id = 'open-meteo-airquality';
  readonly name = 'CAMS / Open-Meteo PM2.5 & AQI (Thailand)';
  readonly category = 'Air Quality';
  readonly sourceUrl = 'https://air-quality-api.open-meteo.com';
  isEnabled = true;
  pollIntervalMs = 300000; // 5 minutes

  private readonly stations = [
    { province: 'กรุงเทพมหานคร', station: 'สถานีตรวจวัดเขตปทุมวัน / พญาไท', lat: 13.7462, lon: 100.5347 },
    { province: 'เชียงใหม่', station: 'สถานีตรวจวัดศาลากลาง จ.เชียงใหม่', lat: 18.8369, lon: 98.9723 },
    { province: 'เชียงราย', station: 'สถานีตรวจวัด อ.เมือง จ.เชียงราย', lat: 19.9072, lon: 99.8325 },
    { province: 'ลำปาง', station: 'สถานีตรวจวัด อ.แม่เมาะ จ.ลำปาง', lat: 18.2778, lon: 99.6589 },
    { province: 'สระบุรี', station: 'สถานีตรวจวัด อ.เฉลิมพระเกียรติ จ.สระบุรี', lat: 14.6542, lon: 100.9125 },
    { province: 'ขอนแก่น', station: 'สถานีตรวจวัด ต.ในเมือง อ.เมือง จ.ขอนแก่น', lat: 16.4419, lon: 102.8359 },
    { province: 'ชลบุรี', station: 'สถานีตรวจวัด แหลมฉบัง อ.ศรีราชา จ.ชลบุรี', lat: 13.0827, lon: 100.8986 },
    { province: 'สมุทรปราการ', station: 'สถานีตรวจวัด อ.เมือง จ.สมุทรปราการ', lat: 13.5991, lon: 100.5968 }
  ];

  async fetchData(): Promise<DataFetchResult> {
    const events: NormalizedEvent[] = [];
    const observations: AirQualityData[] = [];
    const errors: string[] = [];

    for (const item of this.stations) {
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${item.lat}&longitude=${item.lon}&current=pm2_5,pm10,european_aqi,us_aqi&timezone=Asia%2FBangkok`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          errors.push(`AQ fetch failed for ${item.province}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const cur = data.current;
        if (!cur) continue;

        const pm25 = cur.pm2_5 ?? 18;
        const pm10 = cur.pm10 ?? 30;
        const aqi = cur.us_aqi ?? Math.round(pm25 * 2.1);
        const recordedTime = cur.time ? new Date(cur.time).toISOString() : new Date().toISOString();

        let statusText = 'คุณภาพอากาศดีมาก';
        let colorCode = '#22c55e';
        let sev: SeverityLevel | null = null;

        // Thai PCD standard PM2.5 thresholds (µg/m³)
        if (pm25 >= 75.1) {
          statusText = 'มีผลกระทบต่อสุขภาพ (สีแดง)';
          colorCode = '#ef4444';
          sev = 'CRITICAL';
        } else if (pm25 >= 37.6) {
          statusText = 'เริ่มมีผลกระทบต่อสุขภาพ (สีส้ม)';
          colorCode = '#f97316';
          sev = 'WARNING';
        } else if (pm25 >= 25.1) {
          statusText = 'คุณภาพปานกลาง (สีเหลือง)';
          colorCode = '#eab308';
          sev = 'WATCH';
        } else if (pm25 >= 15.1) {
          statusText = 'คุณภาพอากาศดี (สีเขียว)';
          colorCode = '#22c55e';
        }

        const obs: AirQualityData = {
          province: item.province,
          stationName: item.station,
          latitude: item.lat,
          longitude: item.lon,
          pm25,
          pm10,
          aqi,
          statusText,
          colorCode,
          recordedAt: recordedTime
        };
        observations.push(obs);

        // Alert if exceeds moderate threshold
        if (sev) {
          events.push({
            id: `pm25-${item.province}-${Date.now().toString().slice(-6)}`,
            fingerprint: `PM25_${item.province}_${recordedTime.substring(0, 13)}`,
            type: 'PM25',
            title: `ฝุ่นละออง PM2.5 สูงเกินเกณฑ์มาตรฐาน จ.${item.province}`,
            description: `สถานีตรวจวัด ${item.station} ตรวจพบค่า PM2.5 อยู่ที่ ${pm25.toFixed(1)} µg/m³ (AQI: ${aqi}) อยู่ในระดับ "${statusText}"`,
            severity: sev,
            status: 'ACTIVE',
            latitude: item.lat,
            longitude: item.lon,
            province: item.province,
            pm25Value: pm25,
            occurredAt: recordedTime,
            detectedAt: new Date().toISOString(),
            source: 'CAMS Air Quality & PCD Standard',
            sourceUrl: 'http://air4thai.pcd.go.th',
            confidence: 0.96
          });
        }
      } catch (err: any) {
        errors.push(`AQ error for ${item.province}: ${err.message}`);
      }
    }

    return {
      events,
      observations,
      errors: errors.length > 0 ? errors : undefined,
      rawCount: observations.length
    };
  }
}
