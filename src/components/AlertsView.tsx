/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Active Alerts Feed & Escalation Center
 */

import React, { useState } from 'react';
import { NormalizedEvent, SeverityLevel, EventType } from '../../shared/types.ts';
import { ShieldAlert, AlertTriangle, Filter, Search, Bell, Clock, MapPin, ExternalLink, ChevronRight } from 'lucide-react';

interface AlertsViewProps {
  events: NormalizedEvent[];
  onSelectEvent: (event: NormalizedEvent) => void;
  onSendDiscord: (event: NormalizedEvent) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ events, onSelectEvent, onSendDiscord }) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = events.filter((e) => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchProv = e.province.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      if (!matchTitle && !matchProv && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            ศูนย์แจ้งเตือนภัยและระดับความเสี่ยง (Disaster Alert Center)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            รวบรวมเหตุการณ์ที่กำลัง Active ทั้งหมด พร้อมระบบตรวจจับการยกระดับความรุนแรง (Escalation) และการเชื่อมโยง Discord
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
            แสดงผล {filtered.length} เหตุการณ์
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเหตุการณ์, จังหวัด, หรือคำอธิบาย..."
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1">ระดับ:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'WATCH', 'INFORMATION'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                severityFilter === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : sev === 'WARNING'
                    ? 'bg-amber-600 text-white'
                    : sev === 'WATCH'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {sev === 'ALL' ? 'ทั้งหมด' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((event) => {
          const isCritical = event.severity === 'CRITICAL';
          const isWarning = event.severity === 'WARNING';

          return (
            <div
              key={event.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                isCritical
                  ? 'border-rose-900/60 shadow-lg shadow-rose-950/20'
                  : isWarning
                  ? 'border-amber-900/50'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <span className="text-2xl p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  {event.type === 'EARTHQUAKE'
                    ? '🌏'
                    : event.type === 'FLOOD'
                    ? '🌊'
                    : event.type === 'STORM'
                    ? '🌀'
                    : event.type === 'PM25'
                    ? '🌫️'
                    : '🌧️'}
                </span>

                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      }`}
                    >
                      {event.severity}
                    </span>
                    <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {event.type}
                    </span>
                    {event.isDemo && (
                      <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
                        ⚠️ DEMO DATA
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-100 text-base group-hover:text-cyan-400 transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      จ.{event.province} {event.district ? `(${event.district})` : ''}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {new Date(event.occurredAt).toLocaleString('th-TH')}
                    </span>
                    <span>แหล่งข้อมูล: {event.source}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                <button
                  onClick={() => onSendDiscord(event)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-colors"
                >
                  แจ้ง Discord
                </button>
                <button
                  onClick={() => onSelectEvent(event)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  ดูรายละเอียด
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            ไม่พบเหตุการณ์ที่ตรงกับเงื่อนไขการค้นหา
          </div>
        )}
      </div>
    </div>
  );
};
