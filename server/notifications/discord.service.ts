/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Discord Notification & Bot Service
 */

import { NormalizedEvent, SeverityLevel } from '../../shared/types.ts';
import { disasterStore } from '../db/store.ts';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  url?: string;
  color: number;
  fields: DiscordEmbedField[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export class DiscordService {
  private static readonly COLOR_MAP: Record<SeverityLevel, number> = {
    CRITICAL: 0xdc2626, // Crimson Red
    WARNING: 0xea580c,  // Amber Orange
    WATCH: 0xd97706,    // Golden Yellow
    INFORMATION: 0x2563eb // Blue
  };

  private static readonly EMOJI_MAP: Record<string, string> = {
    EARTHQUAKE: '🌏',
    FLOOD: '🌊',
    HEAVY_RAIN: '🌧️',
    STORM: '⛈️',
    THUNDERSTORM: '⚡',
    PM25: '🌫️',
    AIR_POLLUTION: '🏭',
    HEAT: '☀️',
    WILDFIRE: '🔥',
    TSUNAMI: '🌊',
    HIGH_WAVES: '🌊',
    OTHER: '⚠️'
  };

  /**
   * Format an event into a rich Discord embed
   */
  public static buildDiscordEmbed(event: NormalizedEvent, isEscalation = false): DiscordEmbed {
    const emoji = this.EMOJI_MAP[event.type] || '⚠️';
    const severityBadge = `【 ${event.severity} 】`;
    const escalationHeader = isEscalation ? '🚨 [ALERT LEVEL ESCALATED / ปรับเพิ่มระดับความรุนแรง]\n' : '';

    const color = this.COLOR_MAP[event.severity] || 0x2563eb;

    const fields: DiscordEmbedField[] = [
      {
        name: '📍 พื้นที่ / จังหวัด',
        value: `${event.province} ${event.district ? `(${event.district})` : ''}`,
        inline: true
      },
      {
        name: '🕒 เวลาเกิดเหตุ',
        value: `<t:${Math.floor(new Date(event.occurredAt).getTime() / 1000)}:R>`,
        inline: true
      },
      {
        name: '📊 ข้อมูลตรวจวัด',
        value: this.formatObservationMetrics(event),
        inline: false
      }
    ];

    if (event.aiAnalysis) {
      fields.push({
        name: '🤖 AI Analysis (สรุปการประเมิน)',
        value: event.aiAnalysis.analysis || event.aiAnalysis.summary,
        inline: false
      });

      if (event.aiAnalysis.recommendations && event.aiAnalysis.recommendations.length > 0) {
        fields.push({
          name: '🛡️ คำแนะนำด้านความปลอดภัย',
          value: event.aiAnalysis.recommendations.map((r) => `• ${r}`).join('\n'),
          inline: false
        });
      }
    }

    fields.push({
      name: '📡 แหล่งที่มาทางการ (Verified Source)',
      value: `[${event.source}](${event.sourceUrl})`,
      inline: false
    });

    return {
      title: `${escalationHeader}${emoji} ${severityBadge} ${event.title}`,
      description: event.description,
      url: event.sourceUrl,
      color,
      fields,
      footer: {
        text: '🇹🇭 THAI WEATHER & DISASTER AI CENTER | ระบบเฝ้าระวังภัยพิบัติแห่งชาติ'
      },
      timestamp: new Date().toISOString()
    };
  }

  private static formatObservationMetrics(event: NormalizedEvent): string {
    const parts: string[] = [];
    if (event.magnitude) parts.push(`• **Magnitude:** ${event.magnitude.toFixed(1)}`);
    if (event.depth) parts.push(`• **ความลึก:** ${event.depth} กม.`);
    if (event.waterLevelMeters) parts.push(`• **ระดับน้ำ:** ${event.waterLevelMeters.toFixed(2)} ม.`);
    if (event.pm25Value) parts.push(`• **PM2.5:** ${event.pm25Value.toFixed(1)} µg/m³`);
    if (event.rainfallMm) parts.push(`• **ปริมาณฝน:** ${event.rainfallMm.toFixed(1)} มม./ชม.`);
    if (event.windSpeedKmh) parts.push(`• **ความเร็วลม:** ${event.windSpeedKmh.toFixed(1)} กม./ชม.`);
    return parts.length > 0 ? parts.join('\n') : '• ข้อมูลตามรายงานสถานีตรวจวัด';
  }

  /**
   * Dispatch notification to a Discord Webhook URL
   */
  public static async sendWebhook(webhookUrl: string, event: NormalizedEvent, isEscalation = false): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      disasterStore.addNotificationLog({
        channel: 'DISCORD_WEBHOOK',
        target: 'Webhook URL not configured or invalid',
        title: event.title,
        severity: event.severity,
        success: false
      });
      return false;
    }

    try {
      const embed = this.buildDiscordEmbed(event, isEscalation);
      const payload = {
        username: 'Thai Disaster AI Center',
        avatar_url: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?w=128&q=80',
        content: event.severity === 'CRITICAL' ? '@everyone 🚨 แจ้งเตือนภัยพิบัติระดับวิกฤต (CRITICAL)' : undefined,
        embeds: [embed]
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const success = res.ok;
      disasterStore.addNotificationLog({
        channel: 'DISCORD_WEBHOOK',
        target: webhookUrl.substring(0, 45) + '...',
        title: event.title,
        severity: event.severity,
        success
      });

      return success;
    } catch (err: any) {
      disasterStore.addNotificationLog({
        channel: 'DISCORD_WEBHOOK',
        target: 'Failed request',
        title: event.title,
        severity: event.severity,
        success: false
      });
      return false;
    }
  }

  /**
   * Process slash commands (can be invoked by bot or tested via API/Dashboard)
   */
  public static handleSlashCommand(command: string, args: string[] = []): any {
    const cmd = command.toLowerCase().replace('/', '');
    const activeEvents = disasterStore.getEvents({ status: 'ACTIVE' });

    switch (cmd) {
      case 'status': {
        const health = disasterStore.getSystemHealth();
        return {
          title: '🇹🇭 THAI WEATHER & DISASTER AI CENTER — System Status',
          description: `**สถานะศูนย์เฝ้าระวัง:** 🟢 ONLINE\n**เหตุการณ์ Active ขณะนี้:** ${health.activeEventsCount} รายการ\n**ตรวจพบวันนี้:** ${health.totalEventsToday} รายการ\n**Uptime:** ${Math.floor(health.uptimeSeconds / 60)} นาที`,
          fields: [
            { name: 'Gemini AI', value: health.geminiAI, inline: true },
            { name: 'USGS Seismology', value: health.earthquakeApi, inline: true },
            { name: 'Weather Radar', value: health.weatherApi, inline: true }
          ]
        };
      }

      case 'earthquake': {
        const eqList = disasterStore.getEarthquakes();
        const topEq = eqList.slice(0, 5);
        return {
          title: '🌏 รายงานแผ่นดินไหวล่าสุด (USGS & TMD)',
          description: topEq.length > 0
            ? topEq.map((e) => `• **M ${e.magnitude.toFixed(1)}** — ${e.place} (${e.distanceToThailandKm} กม. จาก จ.${e.nearestThaiProvince})`).join('\n')
            : 'ไม่มีรายงานแผ่นดินไหวมีนัยสำคัญในภูมิภาคขณะนี้'
        };
      }

      case 'flood': {
        const stations = disasterStore.getFloodStations();
        return {
          title: '🌊 รายงานสถานการณ์น้ำท่าและลุ่มน้ำหลัก',
          description: stations.map((s) => `• **${s.stationName}**: ระดับน้ำ ${s.waterLevelM} ม. (${s.capacityPercent}% ความจุ, สถานะ: ${s.status})`).join('\n')
        };
      }

      case 'pm25': {
        const aq = disasterStore.getAirQualityData();
        return {
          title: '🌫️ รายงานคุณภาพอากาศ PM2.5 ทั่วประเทศ',
          description: aq.map((a) => `• **${a.province}**: PM2.5 **${a.pm25.toFixed(1)}** µg/m³ (AQI: ${a.aqi}) — ${a.statusText}`).join('\n')
        };
      }

      case 'weather': {
        const wx = disasterStore.getWeatherObservations();
        return {
          title: '🌦️ สภาพอากาศปัจจุบันตามภูมิภาค',
          description: wx.slice(0, 6).map((w) => `• **${w.province}**: ${w.temperature}°C, ความชื้น ${w.humidity}%, ${w.condition}`).join('\n')
        };
      }

      case 'alerts': {
        const crits = activeEvents.filter((e) => ['CRITICAL', 'WARNING'].includes(e.severity));
        return {
          title: '🚨 การแจ้งเตือนระดับเฝ้าระวังสูง (Alerts)',
          description: crits.length > 0
            ? crits.map((e) => `• [${e.severity}] **${e.title}** (${e.province})`).join('\n')
            : 'ไม่มีการแจ้งเตือนระดับวิกฤตในขณะนี้ ทุกพื้นที่อยู่ในเกณฑ์ปกติ'
        };
      }

      default:
        return {
          title: 'คำสั่งบอทแจ้งเตือนภัยพิบัติ (Help)',
          description: '`/status` — ดูสถานะระบบ\n`/alerts` — ดูการแจ้งเตือนทั้งหมด\n`/earthquake` — แผ่นดินไหว\n`/flood` — ระดับน้ำ\n`/pm25` — ค่าฝุ่น\n`/weather` — สภาพอากาศ'
        };
    }
  }
}
