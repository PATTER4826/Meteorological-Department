/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Main Operations Dashboard Overview
 */

import React from 'react';
import {
  NormalizedEvent,
  WeatherObservationData,
  EarthquakeData,
  FloodStationData,
  AirQualityData,
  SeverityLevel
} from '../../shared/types.ts';
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  Info,
  Waves,
  Activity,
  Wind,
  CloudRain,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface DashboardOverviewProps {
  events: NormalizedEvent[];
  earthquakes: EarthquakeData[];
  weather: WeatherObservationData[];
  floods: FloodStationData[];
  airQuality: AirQualityData[];
  onSelectEvent: (event: NormalizedEvent) => void;
  onOpenAI: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  events,
  earthquakes,
  weather,
  floods,
  airQuality,
  onSelectEvent,
  onOpenAI,
  onNavigateToTab
}) => {
  const activeEvents = events.filter((e) => e.status === 'ACTIVE');
  const criticalCount = activeEvents.filter((e) => e.severity === 'CRITICAL').length;
  const warningCount = activeEvents.filter((e) => e.severity === 'WARNING').length;
  const watchCount = activeEvents.filter((e) => e.severity === 'WATCH').length;
  const infoCount = activeEvents.filter((e) => e.severity === 'INFORMATION').length;

  // Chart data: PM2.5 top ranking
  const pmRankingData = [...airQuality]
    .sort((a, b) => b.pm25 - a.pm25)
    .slice(0, 6)
    .map((item) => ({
      name: item.province.replace('จังหวัด', '').replace('มหานคร', ''),
      pm25: item.pm25,
      color: item.pm25 > 75 ? '#ef4444' : item.pm25 > 37.5 ? '#f97316' : '#22c55e'
    }));

  // Chart data: Severity Donut
  const severityDonutData = [
    { name: 'Critical', value: criticalCount || 1, color: '#ef4444' },
    { name: 'Warning', value: warningCount || 2, color: '#f97316' },
    { name: 'Watch', value: watchCount || 3, color: '#eab308' },
    { name: 'Info', value: infoCount || 4, color: '#3b82f6' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/50 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              วิกฤต (CRITICAL)
            </span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-rose-400 font-mono tracking-tight">
              {criticalCount}
            </span>
            <span className="text-xs text-slate-400">เหตุการณ์มีผลกระทบรุนแรง</span>
          </div>
          <div className="text-[11px] text-rose-300/80 flex items-center gap-1 font-medium">
            <span>ส่งสัญญาณ Discord & Alarm ทันที</span>
          </div>
        </div>

        {/* Warning */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/50 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              เตือนภัย (WARNING)
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
              {warningCount}
            </span>
            <span className="text-xs text-slate-400">จุดเสี่ยงสูงที่ต้องเตรียมพร้อม</span>
          </div>
          <div className="text-[11px] text-amber-300/80 flex items-center gap-1 font-medium">
            <span>เฝ้าระวังใกล้ชิดตามแนวทาง ปภ.</span>
          </div>
        </div>

        {/* Watch */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-yellow-950/40 via-slate-900 to-slate-900 border border-yellow-900/40 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              เฝ้าระวัง (WATCH)
            </span>
            <Eye className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-yellow-400 font-mono tracking-tight">
              {watchCount}
            </span>
            <span className="text-xs text-slate-400">แนวโน้มการเปลี่ยนแปลงสภาพ</span>
          </div>
          <div className="text-[11px] text-yellow-300/80 flex items-center gap-1 font-medium">
            <span>ติดตามการรายงานรอบถัดไป</span>
          </div>
        </div>

        {/* Info */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/40 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              ข้อมูลทั่วไป (INFO)
            </span>
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-blue-400 font-mono tracking-tight">
              {infoCount}
            </span>
            <span className="text-xs text-slate-400">สถานีรายงานสถานะปกติ</span>
          </div>
          <div className="text-[11px] text-blue-300/80 flex items-center gap-1 font-medium">
            <span>ตรวจสอบเรดาร์และเซนเซอร์</span>
          </div>
        </div>
      </div>

      {/* AI Situational Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-900/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              🇹🇭 สรุปภาพรวมสถานการณ์ประเทศไทยโดย AI (Gemini 3.8 Flash)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ประมวลผลข้อมูลร่วมจาก TMD, USGS, กรมชลประทาน และ คพ.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAI}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-950"
        >
          <span>เปิดบทวิเคราะห์ & ถาม AI</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid: Live Event Feed & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Event Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-slate-100 text-sm">
                ศูนย์รายงานเหตุการณ์เรียลไทม์ (Live Disaster & Weather Feed)
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('alerts')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              ดูทั้งหมด ({activeEvents.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {activeEvents.slice(0, 6).map((event) => {
              const sevBadge =
                event.severity === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : event.severity === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : event.severity === 'WATCH'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

              const icon =
                event.type === 'EARTHQUAKE'
                  ? '🌏'
                  : event.type === 'FLOOD'
                  ? '🌊'
                  : event.type === 'STORM'
                  ? '🌀'
                  : event.type === 'PM25'
                  ? '🌫️'
                  : '🌧️';

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {icon}
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${sevBadge}`}>
                          {event.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {event.title}
                        </span>
                        {event.isDemo && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            DEMO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          จ.{event.province}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {new Date(event.occurredAt).toLocaleTimeString('th-TH')}
                        </span>
                        <span className="text-slate-400">แหล่งข้อมูล: {event.source}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 shrink-0 mt-2 transition-transform group-hover:translate-x-1" />
                </div>
              );
            })}

            {activeEvents.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                ขณะนี้ไม่มีเหตุการณ์รุนแรงในพื้นที่เฝ้าระวัง ระบบตรวจวัดอัตโนมัติทำงานปกติ
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Visual Analytics & Gauges */}
        <div className="flex flex-col gap-6">
          {/* PM2.5 Ranking Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm">
                🌫️ อันดับค่าฝุ่น PM2.5 (µg/m³)
              </h3>
              <span className="text-[11px] text-slate-400">เกณฑ์มาตรฐาน คพ.</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pmRankingData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={65} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} µg/m³`, 'PM2.5']}
                  />
                  <Bar dataKey="pm25" radius={[0, 6, 6, 0]}>
                    {pmRankingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick River Basin Hydrological Status */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-blue-400" />
                ระดับน้ำลุ่มน้ำหลัก (River Basins)
              </h3>
              <button
                onClick={() => onNavigateToTab('flood')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {floods.slice(0, 4).map((f) => (
                <div key={f.stationId} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate">{f.stationName}</span>
                    <span className="font-mono font-bold text-cyan-400">{f.capacityPercent}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        f.capacityPercent >= 88 ? 'bg-rose-500' : f.capacityPercent >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, f.capacityPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
