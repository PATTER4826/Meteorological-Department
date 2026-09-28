/**
 * 🇹🇭 THAI WEATHER & DISASTER AI CENTER
 * Main Full-Stack Application Component
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  NormalizedEvent,
  EarthquakeData,
  WeatherObservationData,
  FloodStationData,
  AirQualityData,
  StormData,
  SystemHealthStatus,
  DataProviderStatus,
  DiscordChannelSetting,
  SituationalSummary
} from '../shared/types.ts';

import { ThailandMap } from './components/ThailandMap.tsx';
import { EventDetailModal } from './components/EventDetailModal.tsx';
import { AIAssistantDrawer } from './components/AIAssistantDrawer.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { EarthquakeView } from './components/EarthquakeView.tsx';
import { FloodView } from './components/FloodView.tsx';
import { WeatherView } from './components/WeatherView.tsx';
import { AirQualityView } from './components/AirQualityView.tsx';
import { AlertsView } from './components/AlertsView.tsx';

import {
  ShieldAlert,
  Map as MapIcon,
  LayoutDashboard,
  Bell,
  Activity,
  Waves,
  CloudRain,
  Wind,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [weather, setWeather] = useState<WeatherObservationData[]>([]);
  const [floods, setFloods] = useState<FloodStationData[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData[]>([]);
  const [storms, setStorms] = useState<StormData[]>([]);
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [providers, setProviders] = useState<DataProviderStatus[]>([]);
  const [discordChannels, setDiscordChannels] = useState<DiscordChannelSetting[]>([]);
  const [summary, setSummary] = useState<SituationalSummary | null>(null);

  // UI state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; type: string } | null>(null);

  // Audio Beep generator using Web Audio API
  const playEmergencyChime = (severity: string) => {
    if (!isAudioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(severity === 'CRITICAL' ? 880 : 587, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  // Clock ticker (Bangkok Time)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Bangkok'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initial Data Fetching
  const fetchAllData = async () => {
    try {
      const [eventsRes, eqRes, wxRes, floodRes, aqRes, stormRes, healthRes, provRes, chanRes, sumRes] =
        await Promise.all([
          fetch('/api/events').then((r) => r.json()),
          fetch('/api/earthquakes').then((r) => r.json()),
          fetch('/api/weather').then((r) => r.json()),
          fetch('/api/floods').then((r) => r.json()),
          fetch('/api/pm25').then((r) => r.json()),
          fetch('/api/storms').then((r) => r.json()),
          fetch('/api/health').then((r) => r.json()),
          fetch('/api/admin/providers').then((r) => r.json()),
          fetch('/api/admin/discord/channels').then((r) => r.json()),
          fetch('/api/summary').then((r) => r.json())
        ]);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (eqRes.data) setEarthquakes(eqRes.data);
      if (wxRes.data) setWeather(wxRes.data);
      if (floodRes.data) setFloods(floodRes.data);
      if (aqRes.data) setAirQuality(aqRes.data);
      if (stormRes.data) setStorms(stormRes.data);
      if (healthRes.data) setHealth(healthRes.data);
      if (provRes.data) setProviders(provRes.data);
      if (chanRes.data) setDiscordChannels(chanRes.data);
      if (sumRes.data) setSummary(sumRes.data);
    } catch (err) {
      console.error('Failed to load disaster center datasets:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Connect to Real-time SSE Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/realtime');

      eventSource.addEventListener('connected', () => {
        setSseConnected(true);
      });

      eventSource.addEventListener('alert:new', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const ev: NormalizedEvent = payload.event;

          setEvents((prev) => {
            const exists = prev.some((item) => item.fingerprint === ev.fingerprint);
            return exists ? prev.map((item) => (item.fingerprint === ev.fingerprint ? ev : item)) : [ev, ...prev];
          });

          // Show floating emergency toast & audio beep
          setToastMessage({
            title: payload.isEscalation ? `🚨 [ESCALATION] ${ev.title}` : `🔔 [ALERT] ${ev.title}`,
            text: ev.description,
            type: ev.severity
          });

          playEmergencyChime(ev.severity);

          setTimeout(() => setToastMessage(null), 7000);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('event:new', (e: MessageEvent) => {
        try {
          const ev: NormalizedEvent = JSON.parse(e.data);
          setEvents((prev) => [ev, ...prev.filter((item) => item.fingerprint !== ev.fingerprint)]);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('event:update', (e: MessageEvent) => {
        try {
          const ev: NormalizedEvent = JSON.parse(e.data);
          setEvents((prev) => prev.map((item) => (item.fingerprint === ev.fingerprint ? ev : item)));
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.onerror = () => {
        setSseConnected(false);
        eventSource?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [isAudioEnabled]);

  // Handle Simulation
  const handleTriggerSimulation = async (scenario: 'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25') => {
    try {
      const res = await fetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      const data = await res.json();
      if (data.data) {
        setSelectedEvent(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Manual Discord Dispatch
  const handleSendDiscord = async (event: NormalizedEvent) => {
    const targetChannel = discordChannels.find((c) => c.webhookUrl && c.subscribedTypes.includes(event.type));
    if (targetChannel && targetChannel.webhookUrl) {
      await fetch('/api/admin/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: targetChannel.webhookUrl })
      });
      setToastMessage({
        title: 'ส่งแจ้งเตือน Discord สำเร็จ',
        text: `กระจายสัญญาณไปยังห้อง ${targetChannel.channelName} เรียบร้อย`,
        type: 'SUCCESS'
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage({
        title: 'ยังไม่ได้ตั้งค่า Webhook',
        text: 'กรุณาตั้งค่า Webhook URL ในแท็บ Settings / Discord Bot',
        type: 'WARNING'
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Emergency Operations Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & National Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 via-amber-600 to-indigo-600 p-[1px] shadow-lg shadow-rose-950/40">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-xl">
                🇹🇭
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white uppercase flex items-center gap-1.5">
                  THAI WEATHER & DISASTER AI CENTER
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  NATIONAL EOC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ศูนย์แจ้งเตือนสภาพอากาศและภัยพิบัติแห่งชาติ (ระบบเชื่อมโยง Discord Bot & AI)
              </p>
            </div>
          </div>

          {/* Right Status Indicators & Controls */}
          <div className="flex items-center gap-3 text-xs">
            {/* Real-time Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTime || '00:00:00'} ICT</span>
            </div>

            {/* SSE Live Connection Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                sseConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{sseConnected ? 'SSE LIVE' : 'CONNECTING...'}</span>
            </div>

            {/* Audio Alarm Toggle */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              title={isAudioEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือนภัย'}
              className={`p-2 rounded-xl border transition-colors ${
                isAudioEnabled
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 shadow-lg shadow-purple-950 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>วิเคราะห์ AI</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            ภาพรวม (Dashboard)
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'map'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            แผนที่ประเทศไทย (Interactive Map)
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'alerts'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            แจ้งเตือนภัย (Alerts)
          </button>

          <button
            onClick={() => setActiveTab('earthquake')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'earthquake'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            แผ่นดินไหว (Earthquake)
          </button>

          <button
            onClick={() => setActiveTab('flood')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'flood'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            สถานการณ์น้ำ (Flood)
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'weather'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            สภาพอากาศ (Weather)
          </button>

          <button
            onClick={() => setActiveTab('pm25')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'pm25'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            คุณภาพอากาศ (PM2.5)
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
              activeTab === 'admin'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            ผู้ดูแลระบบ (Admin)
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-[999] max-w-md p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
            <span className="text-xl">🚨</span>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-slate-100">{toastMessage.title}</span>
              <p className="text-xs text-slate-300">{toastMessage.text}</p>
            </div>
          </div>
        )}

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            events={events}
            earthquakes={earthquakes}
            weather={weather}
            floods={floods}
            airQuality={airQuality}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onOpenAI={() => setIsAiDrawerOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Tab 2: Interactive Thailand Map */}
        {activeTab === 'map' && (
          <div className="flex flex-col gap-4 h-[calc(100vh-170px)] min-h-[600px]">
            <ThailandMap
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
            />
          </div>
        )}

        {/* Tab 3: Alerts Feed */}
        {activeTab === 'alerts' && (
          <AlertsView
            events={events}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onSendDiscord={handleSendDiscord}
          />
        )}

        {/* Tab 4: Earthquake */}
        {activeTab === 'earthquake' && (
          <EarthquakeView
            earthquakes={earthquakes}
            events={events}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
          />
        )}

        {/* Tab 5: Flood */}
        {activeTab === 'flood' && (
          <FloodView
            stations={floods}
            events={events}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
          />
        )}

        {/* Tab 6: Weather */}
        {activeTab === 'weather' && (
          <WeatherView weather={weather} storms={storms} />
        )}

        {/* Tab 7: PM2.5 */}
        {activeTab === 'pm25' && (
          <AirQualityView airQuality={airQuality} />
        )}

        {/* Tab 8: Admin & Setup Wizard */}
        {activeTab === 'admin' && (
          <AdminPanel
            providers={providers}
            discordChannels={discordChannels}
            health={health}
            onRefreshProviders={fetchAllData}
            onRefreshHealth={fetchAllData}
            onTriggerSimulation={handleTriggerSimulation}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🇹🇭 THAI WEATHER & DISASTER AI CENTER</span>
            <span>•</span>
            <span>ระบบเฝ้าระวังภัยพิบัติแห่งชาติ</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-400">แหล่งข้อมูลทางการ: USGS • กรมอุตุนิยมวิทยา • กรมชลประทาน • กรมควบคุมมลพิษ</span>
          </div>
        </div>
      </footer>

      {/* Event Details Inspection Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSendToDiscord={handleSendDiscord}
      />

      {/* AI Assistant & Situational Summary Drawer */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        summary={summary}
        events={events}
        onRefreshSummary={fetchAllData}
      />
    </div>
  );
}
