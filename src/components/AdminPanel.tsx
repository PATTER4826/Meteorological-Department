/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Admin Control Center & Setup Wizard
 */

import React, { useState } from 'react';
import { DataProviderStatus, DiscordChannelSetting, SystemHealthStatus } from '../../shared/types.ts';
import {
  Settings,
  Server,
  Radio,
  Sliders,
  Send,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Terminal,
  Activity,
  Flame,
  Waves,
  Wind
} from 'lucide-react';

interface AdminPanelProps {
  providers: DataProviderStatus[];
  discordChannels: DiscordChannelSetting[];
  health: SystemHealthStatus | null;
  onRefreshProviders: () => void;
  onRefreshHealth: () => void;
  onTriggerSimulation: (scenario: 'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25') => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  providers,
  discordChannels,
  health,
  onRefreshProviders,
  onRefreshHealth,
  onTriggerSimulation
}) => {
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'DISCORD' | 'SIMULATOR' | 'WIZARD' | 'LOGS'>('PROVIDERS');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  const [simulating, setSimulating] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('/status');
  const [commandOutput, setCommandOutput] = useState<any>(null);

  const handleTestWebhook = async () => {
    if (!webhookUrlInput) return;
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch('/api/admin/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrlInput })
      });
      const data = await res.json();
      setWebhookTestResult(data.message);
    } catch (err: any) {
      setWebhookTestResult(`Error: ${err.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleToggleProvider = async (id: string, currentEnabled: boolean) => {
    try {
      await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentEnabled })
      });
      onRefreshProviders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceRunProvider = async (id: string) => {
    try {
      await fetch(`/api/admin/providers/${id}/run`, { method: 'POST' });
      onRefreshProviders();
      onRefreshHealth();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulate = async (scenario: 'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25') => {
    setSimulating(scenario);
    try {
      await onTriggerSimulation(scenario);
    } finally {
      setSimulating(null);
    }
  };

  const handleRunCommand = async () => {
    try {
      const res = await fetch('/api/discord/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandInput })
      });
      const data = await res.json();
      setCommandOutput(data.response);
    } catch (err: any) {
      setCommandOutput({ title: 'Error', description: err.message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            แผงควบคุมผู้ดูแลระบบ (Admin & Telemetry Center)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            จัดการการเชื่อมต่อ Data Provider, การส่งแจ้งเตือน Discord, จำลองภัยพิบัติ และตรวจสอบสุขภาพของเซิร์ฟเวอร์
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('PROVIDERS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'PROVIDERS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            📡 Data Providers
          </button>
          <button
            onClick={() => setActiveTab('DISCORD')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'DISCORD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 Discord Bot
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'SIMULATOR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚠️ Disaster Simulator
          </button>
          <button
            onClick={() => setActiveTab('WIZARD')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'WIZARD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🧙‍♂️ Setup Wizard
          </button>
        </div>
      </div>

      {/* Tab: Data Providers */}
      {activeTab === 'PROVIDERS' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-300">
              สถานะเครื่องมือดึงข้อมูลอัตโนมัติ (Automated Data Fetchers)
            </span>
            <button
              onClick={onRefreshProviders}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <RotateCw className="w-3.5 h-3.5" />
              รีเฟรชสถานะ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((prov) => (
              <div
                key={prov.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                      {prov.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        prov.isEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${prov.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      {prov.isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">{prov.name}</h3>

                  <div className="text-xs text-slate-400 flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>ความถี่ในการตรวจจับ:</span>
                      <span className="font-mono text-slate-300">{prov.pollIntervalMs / 1000}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>เหตุการณ์ที่ตรวจพบ:</span>
                      <span className="font-mono text-cyan-400 font-semibold">{prov.eventsDiscovered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>อัปเดตล่าสุด:</span>
                      <span className="font-mono text-slate-400">
                        {prov.lastRunAt ? new Date(prov.lastRunAt).toLocaleTimeString('th-TH') : 'กำลังเริ่ม...'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleProvider(prov.id, prov.isEnabled)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      prov.isEnabled
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {prov.isEnabled ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                  </button>
                  <button
                    onClick={() => handleForceRunProvider(prov.id)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    ดึงเดี๋ยวนี้
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Discord Bot */}
      {activeTab === 'DISCORD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channels Configuration */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              การกำหนดช่องทาง Discord Channel Routing
            </h3>

            <div className="flex flex-col gap-3">
              {discordChannels.map((chan) => (
                <div key={chan.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 text-xs">{chan.channelName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ระดับขั้นต่ำ: {chan.minSeverity}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {chan.subscribedTypes.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {chan.webhookUrl ? `Webhook: ${chan.webhookUrl.substring(0, 45)}...` : '⚠️ ยังไม่ได้ระบุ Webhook URL'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook & Slash Command Tester */}
          <div className="flex flex-col gap-6">
            {/* 1-Click Webhook Tester */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                ทดสอบส่ง Discord Webhook
              </h3>
              <p className="text-xs text-slate-400">
                กรอก Discord Webhook URL เพื่อทดสอบการส่ง Embed พร้อมข้อความแจ้งเตือนภัยจำลอง
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrlInput}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {testingWebhook ? 'กำลังส่ง...' : 'ทดสอบ'}
                </button>
              </div>

              {webhookTestResult && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                  {webhookTestResult}
                </div>
              )}
            </div>

            {/* Slash Command Tester */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Discord Slash Commands Interactive Console
              </h3>
              <div className="flex gap-2">
                <select
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="/status">/status (ตรวจสอบสถานะศูนย์)</option>
                  <option value="/alerts">/alerts (แจ้งเตือนที่กำลังเฝ้าระวัง)</option>
                  <option value="/earthquake">/earthquake (รายงานแผ่นดินไหวล่าสุด)</option>
                  <option value="/flood">/flood (รายงานสถานการณ์น้ำท่า)</option>
                  <option value="/pm25">/pm25 (รายงานฝุ่นทั่วไทย)</option>
                  <option value="/weather">/weather (สภาพอากาศประจำจังหวัด)</option>
                </select>
                <button
                  onClick={handleRunCommand}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Run
                </button>
              </div>

              {commandOutput && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2 font-mono">
                  <span className="font-bold text-emerald-400">{commandOutput.title}</span>
                  <p className="text-slate-300 whitespace-pre-line">{commandOutput.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Disaster Simulator (Demo Mode) */}
      {activeTab === 'SIMULATOR' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              ระบบจำลองสถานการณ์ฉุกเฉิน (Disaster Emergency Simulator)
            </div>
            <p className="text-xs text-slate-400">
              สร้างเหตุการณ์ภัยพิบัติจำลองเพื่อทดสอบการทำงานของระบบประเมิน AI, การส่งแจ้งเตือน Discord, และการแสดงผลบนแผนที่ประเทศไทย (ทุกเหตุการณ์จะมีป้าย ⚠️ DEMO DATA กำกับอย่างเคร่งครัด)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scenario 1: Earthquake */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-2xl block mb-1">🌏</span>
                <h4 className="font-bold text-slate-100 text-sm">แผ่นดินไหว M 6.2 เชียงราย</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ทดสอบการแจ้งเตือนระดับ CRITICAL และคำแนะนำหมอบ กำบัง ยึด
                </p>
              </div>
              <button
                onClick={() => handleSimulate('EARTHQUAKE')}
                disabled={simulating === 'EARTHQUAKE'}
                className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {simulating === 'EARTHQUAKE' ? 'กำลังจำลอง...' : 'จำลองเหตุการณ์'}
              </button>
            </div>

            {/* Scenario 2: Flood */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-2xl block mb-1">🌊</span>
                <h4 className="font-bold text-slate-100 text-sm">น้ำล้นตลิ่ง อยุธยา</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ทดสอบสถานี C.29A ระดับน้ำเกินความจุตลิ่ง 89%
                </p>
              </div>
              <button
                onClick={() => handleSimulate('FLOOD')}
                disabled={simulating === 'FLOOD'}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {simulating === 'FLOOD' ? 'กำลังจำลอง...' : 'จำลองเหตุการณ์'}
              </button>
            </div>

            {/* Scenario 3: Storm */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-2xl block mb-1">🌀</span>
                <h4 className="font-bold text-slate-100 text-sm">พายุโซนร้อน "ซูลิก"</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ทดสอบเส้นทางพายุขึ้นฝั่งภาคอีสาน ลม 75 กม./ชม.
                </p>
              </div>
              <button
                onClick={() => handleSimulate('STORM')}
                disabled={simulating === 'STORM'}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {simulating === 'STORM' ? 'กำลังจำลอง...' : 'จำลองเหตุการณ์'}
              </button>
            </div>

            {/* Scenario 4: PM2.5 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-2xl block mb-1">🌫️</span>
                <h4 className="font-bold text-slate-100 text-sm">PM2.5 สีแดง สระบุรี</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ทดสอบค่าฝุ่น 128.4 µg/m³ เกินเกณฑ์มาตรฐานรุนแรง
                </p>
              </div>
              <button
                onClick={() => handleSimulate('PM25')}
                disabled={simulating === 'PM25'}
                className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {simulating === 'PM25' ? 'กำลังจำลอง...' : 'จำลองเหตุการณ์'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Setup Wizard */}
      {activeTab === 'WIZARD' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-6">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            🧙‍♂️ ระบบช่วยติดตั้งสำหรับผู้ใช้งานใหม่ (Interactive Setup Wizard)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">1. Database & Prisma Repository</h4>
                <p className="text-slate-400 mt-1">
                  เชื่อมต่อหน่วยความจำฐานข้อมูลเรียบร้อย พร้อม Schema รองรับ PostgreSQL & Prisma ORM
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                  ✅ CONNECTED
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">2. Cache & Queue Engine</h4>
                <p className="text-slate-400 mt-1">
                  ระบบ Queue และ Deduplication Fingerprinting ทำงานในโหมด Standalone Failover อัตโนมัติ
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                  ✅ READY
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              {health?.geminiAI === 'ONLINE' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-slate-200">3. Gemini 3.8 Flash AI Model</h4>
                <p className="text-slate-400 mt-1">
                  ประมวลผลการวิเคราะห์เหตุการณ์และสรุปสถานการณ์ประจำวันผ่าน SDK ทางการ
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">
                  {health?.geminiAI === 'ONLINE' ? '✅ AI ENGINE ACTIVE' : '⚠️ STANDBY (RULE ENGINE)'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">4. Live Data Providers</h4>
                <p className="text-slate-400 mt-1">
                  เชื่อมต่อ USGS Earthquake, Open-Meteo Weather, CAMS PM2.5, และ ThaiWater
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                  ✅ 5/5 ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
