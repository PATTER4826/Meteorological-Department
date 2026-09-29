/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Discord Notification & Bot Service (24/7 Channel & Webhook Dispatcher)
 */

import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import type { NormalizedEvent, SeverityLevel } from '../../shared/types.ts';
import { disasterStore } from '../db/store.ts';
import { logger } from '../utils/logger.ts';

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
  private static client: Client | null = null;
  private static isBotReady = false;
  private static botLoginAttempted = false;
  private static inaccessibleChannels: Map<string, number> = new Map();

  private static readonly COLOR_MAP: Record<SeverityLevel, number> = {
    CRITICAL: 0xdc2626, // Crimson Red
    WARNING: 0xea580c,  // Amber Orange
    WATCH: 0xd97706,    // Golden Yellow
    INFORMATION: 0x22c55e // Green
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

  private static readonly SEVERITY_BADGE: Record<SeverityLevel, string> = {
    INFORMATION: '🟢 ข้อมูล (INFORMATION)',
    WATCH: '🟡 เฝ้าระวัง (WATCH)',
    WARNING: '🟠 ควรระวัง / เตือนภัย (WARNING)',
    CRITICAL: '🔴 รุนแรง / วิกฤต (CRITICAL)'
  };

  /**
   * Initialize Discord Bot Client if DISCORD_TOKEN is set
   */
  public static async initBot(): Promise<void> {
    const token = process.env.DISCORD_TOKEN?.trim();
    if (!token) {
      logger.info('DISCORD_TOKEN not configured. Discord Bot client in standby mode (Webhook alerts active).');
      return;
    }

    if (this.botLoginAttempted) return;
    this.botLoginAttempted = true;

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages
        ]
      });

      this.client.once('ready', (c) => {
        this.isBotReady = true;
        logger.info(`Discord Bot logged in successfully as ${c.user.tag}`);
      });

      this.client.on('error', (err) => {
        logger.warn(`Discord client internal warning: ${err.message}`);
      });

      await this.client.login(token);
    } catch (err: any) {
      this.isBotReady = false;
      logger.warn(`Discord bot login could not connect (${err.message}). Continuing in Webhook fallback mode.`);
    }
  }

  public static isOnline(): boolean {
    return this.isBotReady;
  }

  public static getBotClient(): Client | null {
    return this.client;
  }

  /**
   * Format an event into a rich Discord embed adhering strictly to verified data
   */
  public static buildDiscordEmbed(
    event: NormalizedEvent,
    options?: { isUpdate?: boolean; isEscalation?: boolean; updateReason?: string; isTest?: boolean }
  ): DiscordEmbed {
    const emoji = this.EMOJI_MAP[event.type] || '⚠️';
    const severityBadge = this.SEVERITY_BADGE[event.severity] || `【 ${event.severity} 】`;

    let titlePrefix = '🚨 แจ้งเตือนภัยพิบัติ';
    if (options?.isTest) {
      titlePrefix = '🧪 [TEST ALERT / ข้อความทดสอบระบบ]';
    } else if (options?.isUpdate) {
      titlePrefix = '🔔 [อัปเดตเหตุการณ์ภัยพิบัติ]';
    } else if (options?.isEscalation) {
      titlePrefix = '🚨 [ยกระดับความรุนแรง / ESCALATION]';
    }

    const color = this.COLOR_MAP[event.severity] || 0x2563eb;

    const fields: DiscordEmbedField[] = [
      {
        name: '🌏 ประเภทภัยพิบัติ',
        value: `${emoji} ${this.getTypeThaiName(event.type)}`,
        inline: true
      },
      {
        name: '📍 พื้นที่ / จังหวัด',
        value: `${event.province} ${event.district ? `(${event.district})` : ''}`,
        inline: true
      },
      {
        name: '📊 ระดับความรุนแรง',
        value: severityBadge,
        inline: true
      },
      {
        name: '⏰ เวลาตรวจพบ',
        value: `<t:${Math.floor(new Date(event.occurredAt).getTime() / 1000)}:f> (<t:${Math.floor(new Date(event.occurredAt).getTime() / 1000)}:R>)`,
        inline: false
      },
      {
        name: '📈 ข้อมูลตรวจวัดสำคัญ (Verified Metrics)',
        value: this.formatObservationMetrics(event),
        inline: false
      }
    ];

    if (options?.isUpdate && options?.updateReason) {
      fields.splice(3, 0, {
        name: '🔄 รายละเอียดการเปลี่ยนแปลง (Update Note)',
        value: `**${options.updateReason}**`,
        inline: false
      });
    }

    if (event.aiAnalysis) {
      const summaryText = event.aiAnalysis.analysis || event.aiAnalysis.summary;
      if (summaryText) {
        fields.push({
          name: '🤖 AI Analysis (สรุปการประเมินสถานการณ์)',
          value: summaryText,
          inline: false
        });
      }

      if (event.aiAnalysis.recommendations && event.aiAnalysis.recommendations.length > 0) {
        fields.push({
          name: '🛡️ คำแนะนำด้านความปลอดภัยสำหรับประชาชน',
          value: event.aiAnalysis.recommendations.map((r) => `• ${r}`).join('\n'),
          inline: false
        });
      }
    }

    fields.push({
      name: '📡 แหล่งข้อมูลทางการ (Verified Source)',
      value: `[${event.source}](${event.sourceUrl || 'https://www.tmd.go.th'})`,
      inline: false
    });

    return {
      title: `${titlePrefix} — ${event.title}`,
      description: options?.isTest
        ? '⚠️ นี่คือข้อความทดสอบระบบ ไม่ใช่เหตุการณ์จริง เพื่อตรวจสอบช่องทางการสื่อสาร'
        : event.description,
      url: event.sourceUrl || undefined,
      color,
      fields,
      footer: {
        text: '🇹🇭 THAI WEATHER & DISASTER AI CENTER | ระบบเตือนภัยพิบัติแห่งชาติตลอด 24 ชม.'
      },
      timestamp: new Date().toISOString()
    };
  }

  private static getTypeThaiName(type: string): string {
    const names: Record<string, string> = {
      EARTHQUAKE: 'แผ่นดินไหว',
      FLOOD: 'น้ำท่วม / ระดับน้ำท่า',
      HEAVY_RAIN: 'ฝนตกหนัก',
      STORM: 'พายุหมุนเขตร้อน',
      THUNDERSTORM: 'พายุฝนฟ้าคะนอง',
      PM25: 'มลพิษทางอากาศ PM2.5',
      AIR_POLLUTION: 'คุณภาพอากาศ',
      HEAT: 'คลื่นความร้อน',
      WILDFIRE: 'ไฟป่า',
      TSUNAMI: 'คลื่นสึนามิ',
      HIGH_WAVES: 'คลื่นลมแรง',
      OTHER: 'ภัยพิบัติอื่นๆ'
    };
    return names[type] || type;
  }

  private static formatObservationMetrics(event: NormalizedEvent): string {
    const parts: string[] = [];
    if (event.magnitude !== undefined) parts.push(`• **Magnitude:** ${event.magnitude.toFixed(1)}`);
    if (event.depth !== undefined) parts.push(`• **ความลึก:** ${event.depth} กม.`);
    if (event.waterLevelMeters !== undefined) parts.push(`• **ระดับน้ำ:** ${event.waterLevelMeters.toFixed(2)} ม.`);
    if (event.pm25Value !== undefined) parts.push(`• **PM2.5:** ${event.pm25Value.toFixed(1)} µg/m³`);
    if (event.rainfallMm !== undefined) parts.push(`• **ปริมาณฝน:** ${event.rainfallMm.toFixed(1)} มม./ชม.`);
    if (event.windSpeedKmh !== undefined) parts.push(`• **ความเร็วลม:** ${event.windSpeedKmh.toFixed(1)} กม./ชม.`);
    return parts.length > 0 ? parts.join('\n') : '• ข้อมูลตามรายงานสถานีตรวจวัด';
  }

  /**
   * Dispatch alert to configured Discord Alert Channel and Webhooks with Retry Backoff
   */
  public static async dispatchAlert(
    event: NormalizedEvent,
    options?: { isUpdate?: boolean; isEscalation?: boolean; updateReason?: string; isTest?: boolean }
  ): Promise<boolean> {
    const alertEnabled = process.env.DISCORD_ALERT_ENABLED !== 'false';
    if (!alertEnabled) {
      logger.info(`Discord alerts are disabled (DISCORD_ALERT_ENABLED=false). Suppressed for "${event.title}".`);
      return false;
    }

    const embed = this.buildDiscordEmbed(event, options);
    let sentCount = 0;

    // 1. Send to DISCORD_ALERT_CHANNEL_ID if bot is online
    const channelId = process.env.DISCORD_ALERT_CHANNEL_ID?.trim();
    if (channelId && this.client && this.isBotReady) {
      const isTemporarilyInaccessible = (this.inaccessibleChannels.get(channelId) || 0) > Date.now();
      if (!isTemporarilyInaccessible) {
        try {
          const sent = await this.sendToChannelWithRetry(channelId, embed);
          if (sent) sentCount++;
        } catch (err: any) {
          logger.warn(`Failed to send alert to Discord Channel ${channelId}: ${err.message}`);
        }
      }
    } else if (channelId && (!this.client || !this.isBotReady)) {
      logger.warn(`DISCORD_ALERT_CHANNEL_ID is set (${channelId}), but bot is not connected. Relying on Webhook channels.`);
    }

    // 2. Dispatch to configured Webhook channels in store
    const channels = disasterStore.discordChannels;
    for (const ch of channels) {
      if (!ch.isActive || !ch.webhookUrl) continue;
      if (!ch.subscribedTypes.includes(event.type)) continue;

      try {
        const ok = await this.sendWebhookWithRetry(ch.webhookUrl, embed, event.severity === 'CRITICAL');
        if (ok) sentCount++;
      } catch (err: any) {
        logger.warn(`Webhook failed for channel "${ch.channelName}": ${err.message}`);
      }
    }

    if (sentCount === 0 && !channelId && channels.every((c) => !c.webhookUrl)) {
      logger.warn(`[ALERT] Event "${event.title}" triggered but no Discord Channel ID or Webhooks are configured.`);
    } else if (sentCount > 0) {
      logger.alert(`[DISCORD] Successfully dispatched alert "${event.title}" to ${sentCount} destination(s).`);
    }

    return sentCount > 0;
  }

  /**
   * Send embed to Discord text channel with retry backoff for transient errors
   */
  private static async sendToChannelWithRetry(channelId: string, embedData: DiscordEmbed, maxRetries = 3): Promise<boolean> {
    if (!this.client || !this.isBotReady) return false;

    // Check temporary suppression
    const inaccessibleUntil = this.inaccessibleChannels.get(channelId);
    if (inaccessibleUntil && Date.now() < inaccessibleUntil) {
      return false;
    }

    // Resolve channel flexibly (supports TextChannel, AnnouncementChannel, ThreadChannel, VoiceChannel, etc.)
    let channel: any = null;
    try {
      channel = await this.client.channels.fetch(channelId);
    } catch (fetchErr: any) {
      // Check if channelId was a Guild ID where the bot resides
      const guild = this.client.guilds.cache.get(channelId) || await this.client.guilds.fetch(channelId).catch(() => null);
      if (guild) {
        channel = guild.systemChannel || guild.channels.cache.find((c: any) => typeof c.send === 'function');
      } else {
        // Look in all guilds the bot joined
        for (const g of this.client.guilds.cache.values()) {
          const found = g.channels.cache.get(channelId);
          if (found) {
            channel = found;
            break;
          }
        }
      }

      if (!channel) {
        this.inaccessibleChannels.set(channelId, Date.now() + 5 * 60 * 1000);
        logger.warn(`Discord Channel ${channelId} could not be resolved (${fetchErr.message}). Webhook fallback active.`);
        return false;
      }
    }

    // If channel is a category or forum, check for a text child
    if (channel && typeof channel.send !== 'function') {
      if ('children' in channel && channel.children?.cache) {
        const textChild = channel.children.cache.find((c: any) => typeof c.send === 'function');
        if (textChild) {
          channel = textChild;
        }
      }
    }

    // Ensure channel is actually sendable
    if (!channel || typeof channel.send !== 'function') {
      this.inaccessibleChannels.set(channelId, Date.now() + 5 * 60 * 1000);
      logger.warn(`Channel ${channelId} (${channel?.name || 'unknown'}) cannot receive text messages. Webhook fallback active.`);
      return false;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const embed = new EmbedBuilder()
          .setTitle(embedData.title)
          .setDescription(embedData.description)
          .setColor(embedData.color)
          .setTimestamp(embedData.timestamp ? new Date(embedData.timestamp) : new Date());

        if (embedData.url) embed.setURL(embedData.url);
        if (embedData.footer) embed.setFooter({ text: embedData.footer.text });
        if (embedData.fields) {
          for (const f of embedData.fields) {
            embed.addFields({ name: f.name, value: f.value, inline: f.inline ?? false });
          }
        }

        await channel.send({ embeds: [embed] });
        return true; // Success
      } catch (err: any) {
        const status = err.status || err.httpStatus;
        const code = err.code;

        // Permanent errors: Missing Permissions (50013), Missing Access (50001), 403 Forbidden
        const isPermanent = status === 403 || status === 404 || code === 50013 || code === 50001;
        if (isPermanent) {
          this.inaccessibleChannels.set(channelId, Date.now() + 5 * 60 * 1000);
          logger.warn(`Bot lacks permission to send messages in Discord Channel ${channelId} (${channel.name || 'unknown'}). Webhook fallback active.`);
          return false;
        }

        if (attempt === maxRetries) {
          logger.warn(`Discord channel dispatch to ${channelId} failed after ${maxRetries} attempts: ${err.message}`);
          return false;
        }

        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Discord channel dispatch attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return false;
  }

  /**
   * Send payload to Discord Webhook URL with Exponential Backoff
   */
  public static async sendWebhookWithRetry(webhookUrl: string, embed: DiscordEmbed, isCritical = false, maxRetries = 3): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return false;
    }

    const payload = {
      username: 'Thai Disaster AI Center',
      avatar_url: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?w=128&q=80',
      content: isCritical ? '@everyone 🚨 แจ้งเตือนภัยพิบัติระดับวิกฤต (CRITICAL)' : undefined,
      embeds: [embed]
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          return true;
        }

        if (res.status === 429) {
          const retryAfter = res.headers.get('retry-after');
          const delay = retryAfter ? parseFloat(retryAfter) * 1000 : 2000;
          logger.warn(`Discord rate limit hit on webhook. Backing off ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        throw new Error(`Webhook responded with HTTP ${res.status}`);
      } catch (err: any) {
        if (attempt === maxRetries) {
          logger.error(`Discord webhook permanently failed after ${maxRetries} attempts: ${err.message}`);
          return false;
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return false;
  }

  /**
   * Dispatch single webhook (for manual test from Admin UI)
   */
  public static async sendWebhook(webhookUrl: string, event: NormalizedEvent, isEscalation = false): Promise<boolean> {
    const embed = this.buildDiscordEmbed(event, { isEscalation });
    return this.sendWebhookWithRetry(webhookUrl, embed, event.severity === 'CRITICAL');
  }

  /**
   * Handle slash commands for Discord bot or interactive testing
   */
  public static handleSlashCommand(command: string, args: string[] = []): any {
    const cmd = command.toLowerCase().replace('/', '');
    const activeEvents = disasterStore.getEvents({ status: 'ACTIVE' });

    switch (cmd) {
      case 'status': {
        const health = disasterStore.getSystemHealth();
        return {
          title: '🇹🇭 THAI WEATHER & DISASTER AI CENTER — System Status',
          description: `**สถานะศูนย์เฝ้าระวัง:** 🟢 ONLINE (24/7 Background Alert Worker Running)\n**เหตุการณ์ Active ขณะนี้:** ${health.activeEventsCount} รายการ\n**ตรวจพบวันนี้:** ${health.totalEventsToday} รายการ\n**Uptime:** ${Math.floor(health.uptimeSeconds / 60)} นาที`,
          fields: [
            { name: 'Gemini AI', value: health.geminiAI, inline: true },
            { name: 'Earthquake API', value: health.earthquakeApi, inline: true },
            { name: 'Weather Radar', value: health.weatherApi, inline: true },
            { name: 'Flood Monitor', value: health.floodApi, inline: true },
            { name: 'Air Quality API', value: health.airQualityApi, inline: true }
          ]
        };
      }

      case 'alerts': {
        const crits = activeEvents.filter((e) => ['CRITICAL', 'WARNING'].includes(e.severity));
        return {
          title: '🚨 การแจ้งเตือนภัยพิบัติระดับเฝ้าระวังสูง (Active Alerts)',
          description: crits.length > 0
            ? crits.map((e) => `• [${e.severity}] **${e.title}** (จ.${e.province})`).join('\n')
            : 'ไม่มีการแจ้งเตือนระดับวิกฤตในขณะนี้ ทุกพื้นที่อยู่ในเกณฑ์ปกติ'
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

      default:
        return {
          title: 'คำสั่งบอทแจ้งเตือนภัยพิบัติ (Help)',
          description: '`/status` — ดูสถานะระบบ 24/7\n`/alerts` — ดูการแจ้งเตือนทั้งหมด\n`/earthquake` — แผ่นดินไหว\n`/flood` — ระดับน้ำ\n`/pm25` — ค่าฝุ่น\n`/weather` — สภาพอากาศ'
        };
    }
  }

  /**
   * Graceful shutdown of bot connection
   */
  public static async destroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
        this.isBotReady = false;
        logger.info('Discord client connection closed gracefully.');
      } catch (err: any) {
        logger.warn(`Error during Discord shutdown: ${err.message}`);
      }
    }
  }
}
