/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Express Full-Stack Server
 */

import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { disasterStore } from './server/db/store.ts';
import { dataCollector } from './server/collector/collector.ts';
import { sseManager } from './server/realtime/sse.ts';
import { geminiService } from './server/ai/gemini.service.ts';
import { DiscordService } from './server/notifications/discord.service.ts';
import { alertWorker } from './server/worker/alert.worker.ts';
import { logger } from './server/utils/logger.ts';
import type { EventType, SeverityLevel, NormalizedEvent } from './shared/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Public Health Check Endpoint (Adheres strictly to Requirement 9)
app.get('/health', (req: Request, res: Response) => {
  const workerHealth = alertWorker.getHealthState();
  res.json({
    status: 'ok',
    discord: DiscordService.isOnline() ? 'online' : (process.env.DISCORD_TOKEN ? 'connecting' : 'standby_webhook'),
    alertWorker: workerHealth.status,
    lastWeatherCheck: workerHealth.lastWeatherCheck || 'none',
    lastEarthquakeCheck: workerHealth.lastEarthquakeCheck || 'none',
    lastFloodCheck: workerHealth.lastFloodCheck || 'none',
    lastStormCheck: workerHealth.lastStormCheck || 'none',
    lastAirQualityCheck: workerHealth.lastAirQualityCheck || 'none'
  });
});

// API Endpoints

// 1. Live Server-Sent Events (SSE) stream
app.get('/api/realtime', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  sseManager.registerClient(clientId, res);
});

// 2. Events list with filtering
app.get('/api/events', (req: Request, res: Response) => {
  const { type, severity, province, status, limit } = req.query;
  const events = disasterStore.getEvents({
    type: type as EventType | undefined,
    severity: severity as SeverityLevel | undefined,
    province: province as string | undefined,
    status: status as string | undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined
  });
  res.json({ success: true, count: events.length, data: events });
});

// 3. Single Event by ID
app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = disasterStore.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  res.json({ success: true, data: event });
});

// 4. Alerts (Active Warning and Critical only)
app.get('/api/alerts', (req: Request, res: Response) => {
  const events = disasterStore.getEvents({ status: 'ACTIVE' });
  const alerts = events.filter((e) => ['CRITICAL', 'WARNING'].includes(e.severity));
  res.json({ success: true, count: alerts.length, data: alerts });
});

// 5. Specialized Observation Data
app.get('/api/weather', (req: Request, res: Response) => {
  res.json({ success: true, data: disasterStore.getWeatherObservations() });
});

app.get('/api/earthquakes', (req: Request, res: Response) => {
  res.json({ success: true, data: disasterStore.getEarthquakes() });
});

app.get('/api/floods', (req: Request, res: Response) => {
  res.json({ success: true, data: disasterStore.getFloodStations() });
});

app.get('/api/pm25', (req: Request, res: Response) => {
  res.json({ success: true, data: disasterStore.getAirQualityData() });
});

app.get('/api/storms', (req: Request, res: Response) => {
  res.json({ success: true, data: disasterStore.getStorms() });
});

// 6. System Health & Stats
app.get('/api/health', (req: Request, res: Response) => {
  const health = disasterStore.getSystemHealth();
  res.json({ success: true, data: health });
});

// 7. Situational Summary Briefing (AI + Stats)
app.get('/api/summary', async (req: Request, res: Response) => {
  const summary = disasterStore.generateSituationalSummary();
  const allEvents = disasterStore.getEvents();
  const aiBriefing = await geminiService.generateDailySummary(allEvents);
  res.json({
    success: true,
    data: {
      ...summary,
      aiDetailedBriefingTh: aiBriefing
    }
  });
});

// 8. Grounded AI Emergency Chat Assistant
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  const currentEvents = disasterStore.getEvents();
  const answer = await geminiService.answerUserQuery(message, currentEvents);
  res.json({ success: true, answer });
});

// 9. Discord Slash Command handler
app.post('/api/discord/command', (req: Request, res: Response) => {
  const { command, args } = req.body;
  const result = DiscordService.handleSlashCommand(command || '/status', args || []);
  res.json({ success: true, response: result });
});

// Admin Routes

// Provider Management
app.get('/api/admin/providers', (req: Request, res: Response) => {
  const list = Array.from(disasterStore.providers.values());
  res.json({ success: true, data: list });
});

app.patch('/api/admin/providers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isEnabled, pollIntervalMs } = req.body;
  const provider = disasterStore.providers.get(id);
  if (!provider) {
    return res.status(404).json({ success: false, error: 'Provider not found' });
  }

  if (typeof isEnabled === 'boolean') provider.isEnabled = isEnabled;
  if (typeof pollIntervalMs === 'number') provider.pollIntervalMs = pollIntervalMs;

  disasterStore.addAuditLog('INFO', `Admin updated provider configuration for ${provider.name}`, { isEnabled, pollIntervalMs });
  res.json({ success: true, data: provider });
});

app.post('/api/admin/providers/:id/run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const prov = disasterStore.providers.get(id);
  if (!prov) {
    return res.status(404).json({ success: false, error: 'Provider not found' });
  }

  // Trigger manual category run on alertWorker
  await alertWorker.runProvider(id);

  res.json({ success: true, message: `Manual sync executed for ${prov.name}`, data: prov });
});

// Discord Settings
app.get('/api/admin/discord/channels', (req: Request, res: Response) => {
  res.json({ success: true, data: disasterStore.discordChannels });
});

app.post('/api/admin/discord/channels', (req: Request, res: Response) => {
  const { channelId, channelName, webhookUrl, subscribedTypes, minSeverity, filterProvinces } = req.body;
  const existing = disasterStore.discordChannels.find((c) => c.channelId === channelId);

  if (existing) {
    if (channelName) existing.channelName = channelName;
    if (webhookUrl !== undefined) existing.webhookUrl = webhookUrl;
    if (subscribedTypes) existing.subscribedTypes = subscribedTypes;
    if (minSeverity) existing.minSeverity = minSeverity;
    if (filterProvinces) existing.filterProvinces = filterProvinces;
    res.json({ success: true, data: existing });
  } else {
    const newChan = {
      id: `chan-${Date.now()}`,
      channelId: channelId || `${Date.now()}`,
      channelName: channelName || '#new-alert',
      webhookUrl: webhookUrl || '',
      subscribedTypes: subscribedTypes || ['EARTHQUAKE', 'FLOOD', 'STORM', 'PM25'],
      minSeverity: minSeverity || 'WARNING',
      filterProvinces: filterProvinces || [],
      isActive: true
    };
    disasterStore.discordChannels.push(newChan);
    res.json({ success: true, data: newChan });
  }
});

// Discord Webhook Test trigger
app.post('/api/admin/discord/test', async (req: Request, res: Response) => {
  const { webhookUrl } = req.body;
  const testEvent: NormalizedEvent = {
    id: `test-${Date.now()}`,
    fingerprint: `TEST_${Date.now()}`,
    type: 'EARTHQUAKE',
    title: 'ทดสอบการส่งสัญญาณแจ้งเตือนระบบ Discord Bot (System Test)',
    description: 'ข้อความทดสอบการเชื่อมต่อระบบเตือนภัย Thai Weather & Disaster AI Center',
    severity: 'WARNING',
    status: 'ACTIVE',
    latitude: 18.7883,
    longitude: 98.9853,
    province: 'เชียงใหม่',
    magnitude: 4.8,
    depth: 10,
    occurredAt: new Date().toISOString(),
    detectedAt: new Date().toISOString(),
    source: 'National Disaster Warning System Test',
    sourceUrl: 'https://ais-dev.run.app',
    confidence: 1.0,
    aiAnalysis: {
      severity: 'WARNING',
      summary: 'ทดสอบการแจ้งเตือนและการทำงานของ Discord Webhook',
      fact: 'ส่งคำสั่งทดสอบจากหน้าแอดมิน Dashboard',
      analysis: 'ระบบเชื่อมต่อสำเร็จและสามารถกระจายสัญญาณได้ตามเกณฑ์ความปลอดภัย',
      recommendations: ['ข้อความทดสอบ ไม่ต้องดำเนินการใดๆ', 'โปรดติดตามประกาศอย่างเป็นทางการจากหน่วยงานราชการ'],
      affectedAreas: ['ศูนย์ปฏิบัติการทดสอบ'],
      vulnerableGroups: ['ผู้ทดสอบระบบ'],
      urgency: 'MODERATE',
      confidence: 1.0,
      analyzedAt: new Date().toISOString()
    }
  };

  const ok = await DiscordService.sendWebhook(webhookUrl, testEvent);
  res.json({ success: ok, message: ok ? 'Discord webhook sent successfully!' : 'Failed to send webhook. Check URL.' });
});

// Disaster Simulation Trigger (Demo Mode)
app.post('/api/admin/simulate', async (req: Request, res: Response) => {
  const { scenario } = req.body;
  const validScenarios = ['EARTHQUAKE', 'FLOOD', 'STORM', 'PM25'];
  const target = validScenarios.includes(scenario) ? scenario : 'EARTHQUAKE';

  const simEvent = await dataCollector.triggerSimulation(target as any);
  res.json({
    success: true,
    message: `Disaster simulation triggered for ${target} with explicit [DEMO DATA] badge.`,
    data: simEvent
  });
});

// Audit and Notification Logs
app.get('/api/admin/logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    auditLogs: disasterStore.getAuditLogs(),
    notificationLogs: disasterStore.getNotificationLogs()
  });
});

// Start 24/7 Autonomous Background Alert Worker
if (process.env.DISABLE_EMBEDDED_WORKER !== 'true') {
  alertWorker.start().catch((err) => {
    logger.error(`Failed to start 24/7 Alert Worker: ${err.message}`);
  });
}

// Frontend Vite Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(PORT) || 3000;
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`🇹🇭 THAI WEATHER & DISASTER AI CENTER server running on port ${port}`);
    logger.info(`📡 Real-time SSE endpoint: http://localhost:${port}/api/realtime`);
    logger.info(`🏥 Health check endpoint: http://localhost:${port}/health`);
  });

  // Graceful shutdown handling (SIGTERM & SIGINT)
  const handleGracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Graceful shutdown sequence initiating...`);
    try {
      await alertWorker.stop();
      server.close(() => {
        logger.info('HTTP server closed. Exiting process safely.');
        process.exit(0);
      });
      // Force exit after 10s if hung
      setTimeout(() => process.exit(0), 10000).unref();
    } catch (e: any) {
      logger.error(`Error during graceful shutdown: ${e.message}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

startServer();
