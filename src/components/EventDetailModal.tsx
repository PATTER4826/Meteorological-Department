/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Event Inspection Modal with Strict FACT / AI ANALYSIS / RECOMMENDATION separation
 */

import React from 'react';
import { NormalizedEvent } from '../../shared/types.ts';
import { X, ExternalLink, ShieldAlert, Cpu, AlertTriangle, CheckCircle2, Clock, MapPin, Gauge } from 'lucide-react';

interface EventDetailModalProps {
  event: NormalizedEvent | null;
  onClose: () => void;
  onSendToDiscord?: (event: NormalizedEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onSendToDiscord }) => {
  if (!event) return null;

  // Calculate data freshness
  const occurredMs = new Date(event.occurredAt).getTime();
  const diffMinutes = Math.floor((Date.now() - occurredMs) / (60 * 1000));
  let freshnessBadge = (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      🟢 LIVE (เรียลไทม์)
    </span>
  );
  if (diffMinutes > 180) {
    freshnessBadge = (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        🔴 ข้อมูลย้อนหลัง ({Math.floor(diffMinutes / 60)} ชม. ที่แล้ว)
      </span>
    );
  } else if (diffMinutes > 30) {
    freshnessBadge = (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
        🟡 อัปเดตเมื่อ {diffMinutes} นาทีที่แล้ว
      </span>
    );
  }

  // Severity styling
  const severityColors = {
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    WARNING: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    WATCH: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    INFORMATION: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${severityColors[event.severity]}`}>
                {event.severity}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-slate-800 text-slate-300">
                {event.type}
              </span>
              {freshnessBadge}
              {event.isDemo && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  ⚠️ DEMO DATA
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-100 leading-snug">
              {event.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                จ.{event.province} {event.district ? `(${event.district})` : ''}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {new Date(event.occurredAt).toLocaleString('th-TH')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Observation Metrics Card (FACT) */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Gauge className="w-4 h-4" />
              1. FACT (ข้อมูลข้อเท็จจริงจากสถานีตรวจวัด)
            </div>
            <span className="text-[11px] text-slate-400">ตรวจพบโดยระบบตรวจจับอัตโนมัติ</span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {event.aiAnalysis?.fact || event.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            {event.magnitude && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ขนาด (Magnitude)</span>
                <span className="text-base font-bold text-rose-400 font-mono">M {event.magnitude.toFixed(1)}</span>
              </div>
            )}
            {event.depth && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ความลึก</span>
                <span className="text-base font-bold text-amber-400 font-mono">{event.depth} กม.</span>
              </div>
            )}
            {event.waterLevelMeters && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ระดับน้ำ</span>
                <span className="text-base font-bold text-blue-400 font-mono">{event.waterLevelMeters.toFixed(2)} ม.</span>
              </div>
            )}
            {event.pm25Value && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ค่า PM2.5</span>
                <span className="text-base font-bold text-orange-400 font-mono">{event.pm25Value.toFixed(1)} µg/m³</span>
              </div>
            )}
            {event.windSpeedKmh && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ความเร็วลม</span>
                <span className="text-base font-bold text-purple-400 font-mono">{event.windSpeedKmh} กม./ชม.</span>
              </div>
            )}
            {event.rainfallMm && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ปริมาณฝน</span>
                <span className="text-base font-bold text-cyan-400 font-mono">{event.rainfallMm.toFixed(1)} มม.</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
              <Cpu className="w-4 h-4" />
              2. AI ANALYSIS (การวิเคราะห์และประเมินผลกระทบโดย Gemini)
            </div>
            {event.aiAnalysis && (
              <span className="text-[11px] font-mono text-purple-300">
                ความเชื่อมั่น {(event.aiAnalysis.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {event.aiAnalysis?.analysis || 'ระบบ AI กำลังประมวลผลการวิเคราะห์ความเสี่ยง...'}
          </p>

          {event.aiAnalysis?.affectedAreas && event.aiAnalysis.affectedAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 font-medium">พื้นที่คาดว่าได้รับผลกระทบ:</span>
              {event.aiAnalysis.affectedAreas.map((area, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-xs bg-purple-900/40 text-purple-200 border border-purple-700/40">
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Safety Guidance & Official Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            3. RECOMMENDATIONS & HUMAN SAFETY DIRECTIVES
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-slate-300">
            {event.aiAnalysis?.recommendations?.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span className={rec.includes('หน่วยงานราชการ') ? 'font-semibold text-amber-200' : ''}>
                  {rec}
                </span>
              </div>
            )) || (
              <div className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span className="font-semibold text-amber-200">
                  โปรดติดตามประกาศและคำสั่งอย่างเป็นทางการจากหน่วยงานราชการและศูนย์บรรเทาสาธารณภัย
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Source Transparency & Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">แหล่งข้อมูลทางการ:</span>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              {event.source}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            {onSendToDiscord && (
              <button
                onClick={() => onSendToDiscord(event)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950"
              >
                <span>💬</span>
                แจ้งเตือน Discord
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
