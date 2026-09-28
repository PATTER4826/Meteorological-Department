/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Real Open-Meteo Weather Provider for Thailand
 */

import { DisasterDataProvider, DataFetchResult } from './provider.interface.ts';
import { NormalizedEvent, WeatherObservationData, SeverityLevel, THAILAND_PROVINCES } from '../../shared/types.ts';

export class WeatherProvider implements DisasterDataProvider {
  readonly id = 'open-meteo-weather';
  readonly name = 'Open-Meteo Weather Radar (Thailand Regional)';
  readonly category = 'Weather';
  readonly sourceUrl = 'https://open-meteo.com';
  isEnabled = true;
  pollIntervalMs = 180000; // 3 minutes

  // Representative stations across Thailand
  private readonly targetProvinces: Array<{ name: string; lat: number; lon: number; en: string }> = [
    { name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018, en: 'Bangkok' },
    { name: 'เชียงใหม่', lat: 18.7883, lon: 98.9853, en: 'Chiang Mai' },
    { name: 'เชียงราย', lat: 19.9105, lon: 99.8406, en: 'Chiang Rai' },
    { name: 'พิษณุโลก', lat: 16.8211, lon: 100.2659, en: 'Phitsanulok' },
    { name: 'ขอนแก่น', lat: 16.4322, lon: 102.8236, en: 'Khon Kaen' },
    { name: 'อุบลราชธานี', lat: 15.2448, lon: 104.8473, en: 'Ubon Ratchathani' },
    { name: 'นครราชสีมา', lat: 14.9799, lon: 102.0978, en: 'Nakhon Ratchasima' },
    { name: 'ชลบุรี', lat: 13.3611, lon: 100.9847, en: 'Chonburi' },
    { name: 'พระนครศรีอยุธยา', lat: 14.3532, lon: 100.5684, en: 'Ayutthaya' },
    { name: 'ภูเก็ต', lat: 7.8804, lon: 98.3923, en: 'Phuket' },
    { name: 'สุราษฎร์ธานี', lat: 9.1382, lon: 99.3217, en: 'Surat Thani' },
    { name: 'สงขลา', lat: 7.1898, lon: 100.5954, en: 'Songkhla' }
  ];

  async fetchData(): Promise<DataFetchResult> {
    const events: NormalizedEvent[] = [];
    const observations: WeatherObservationData[] = [];
    const errors: string[] = [];

    // Batch query up to 6 stations per cycle to avoid rate limits
    const subset = this.targetProvinces.slice(0, 8);

    for (const prov of subset) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${prov.lat}&longitude=${prov.lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=Asia%2FBangkok`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          errors.push(`Failed for ${prov.name}: HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        const cur = data.current;
        if (!cur) continue;

        const temp = cur.temperature_2m ?? 30;
        const humidity = cur.relative_humidity_2m ?? 70;
        const rainMm = cur.rain ?? cur.precipitation ?? 0;
        const windSpeed = cur.wind_speed_10m ?? 10;
        const windDir = cur.wind_direction_10m ?? 0;
        const pressure = cur.surface_pressure ?? 1012;
        const weatherCode = cur.weather_code ?? 0;
        const recordedTime = cur.time ? new Date(cur.time).toISOString() : new Date().toISOString();

        // Interpret weather code (WMO standard)
        let condition = 'แจ่มใส / เมฆบางส่วน';
        let isThunder = false;
        let isHeavyRain = false;

        if ([95, 96, 99].includes(weatherCode)) {
          condition = 'พายุฝนฟ้าคะนองรุนแรง';
          isThunder = true;
        } else if ([65, 82].includes(weatherCode) || rainMm >= 30) {
          condition = 'ฝนตกหนักมาก';
          isHeavyRain = true;
        } else if ([63, 81].includes(weatherCode) || (rainMm >= 10 && rainMm < 30)) {
          condition = 'ฝนตกปานกลาง';
        } else if ([61, 80, 51, 53, 55].includes(weatherCode) || (rainMm > 0 && rainMm < 10)) {
          condition = 'ฝนตกเล็กน้อย/ละอองฝน';
        } else if ([1, 2, 3].includes(weatherCode)) {
          condition = 'มีเมฆเป็นส่วนมาก';
        }

        const obs: WeatherObservationData = {
          province: prov.name,
          provinceEn: prov.en,
          stationName: `สถานีตรวจวัดอุตุนิยมวิทยา ${prov.name}`,
          latitude: prov.lat,
          longitude: prov.lon,
          temperature: temp,
          humidity,
          pressure,
          windSpeed,
          windDirection: windDir,
          rainMmPerHour: rainMm,
          condition,
          recordedAt: recordedTime
        };
        observations.push(obs);

        // Generate events if conditions warrant alerting
        if (isThunder || (rainMm >= 35) || windSpeed >= 50) {
          const sev: SeverityLevel = rainMm >= 50 || windSpeed >= 65 ? 'CRITICAL' : 'WARNING';
          const type = isThunder ? 'THUNDERSTORM' : 'HEAVY_RAIN';

          events.push({
            id: `wx-${prov.en.toLowerCase()}-${Date.now().toString().slice(-6)}`,
            fingerprint: `${type}_${prov.name}_${recordedTime.substring(0, 13)}`,
            type,
            title: `เตือนภัย ${condition} ในพื้นที่ จ.${prov.name}`,
            description: `สถานีตรวจวัดพบ${condition} ปริมาณฝน ${rainMm.toFixed(1)} มม./ชม. ความเร็วลมกระโชก ${windSpeed.toFixed(1)} กม./ชม. อุณหภูมิ ${temp}°C`,
            severity: sev,
            status: 'ACTIVE',
            latitude: prov.lat,
            longitude: prov.lon,
            province: prov.name,
            windSpeedKmh: windSpeed,
            rainfallMm: rainMm,
            occurredAt: recordedTime,
            detectedAt: new Date().toISOString(),
            source: 'Open-Meteo & TMD Radar',
            sourceUrl: `https://open-meteo.com/en/docs?latitude=${prov.lat}&longitude=${prov.lon}`,
            confidence: 0.95
          });
        } else if (temp >= 40.5) {
          events.push({
            id: `heat-${prov.en.toLowerCase()}-${Date.now().toString().slice(-6)}`,
            fingerprint: `HEAT_${prov.name}_${recordedTime.substring(0, 10)}`,
            type: 'HEAT',
            title: `เฝ้าระวังอากาศร้อนจัด (ดัชนีความร้อนสูง) จ.${prov.name}`,
            description: `อุณหภูมิวัดได้ ${temp.toFixed(1)}°C ความชื้นสัมพัทธ์ ${humidity}% ขอให้ประชาชนระวังโรคลมแดด (Heatstroke)`,
            severity: temp >= 42.0 ? 'WARNING' : 'WATCH',
            status: 'ACTIVE',
            latitude: prov.lat,
            longitude: prov.lon,
            province: prov.name,
            occurredAt: recordedTime,
            detectedAt: new Date().toISOString(),
            source: 'Open-Meteo & TMD Radar',
            sourceUrl: `https://open-meteo.com`,
            confidence: 0.92
          });
        }
      } catch (err: any) {
        errors.push(`Error fetching for ${prov.name}: ${err.message}`);
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
