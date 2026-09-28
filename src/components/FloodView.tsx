/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Hydrological & River Basin Flood Monitoring
 */

import React from 'react';
import { FloodStationData, NormalizedEvent } from '../../shared/types.ts';
import { Waves, ArrowUpRight, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FloodViewProps {
  stations: FloodStationData[];
  events: NormalizedEvent[];
  onSelectEvent: (event: NormalizedEvent) => void;
}

export const FloodView: React.FC<FloodViewProps> = ({ stations, events, onSelectEvent }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-blue-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-400" />
            ศูนย์ติดตามสถานการณ์น้ำและอุทกภัยแห่งชาติ (River Basin Hydrological Telemetry)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจวัดระดับน้ำเทียบกับตลิ่ง (ม.รทก.) ในลุ่มน้ำเจ้าพระยา, ปิง, วัง, ยม, น่าน, มูล, และชี พร้อมระบบแจ้งเตือนน้ำเอ่อล้นตลิ่ง
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
          แหล่งข้อมูล: ThaiWater & กรมชลประทาน (RID)
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((st) => {
          const isWarning = st.capacityPercent >= 85;
          const isWatch = st.capacityPercent >= 75;

          return (
            <div
              key={st.stationId}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/50 text-blue-300 border border-blue-800/40">
                    {st.basin}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isWarning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isWatch
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm mt-1">{st.stationName}</h3>
                <span className="text-xs text-slate-400">จ.{st.province} ({st.river})</span>

                {/* Progress bar */}
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">ความจุลำน้ำ:</span>
                    <span className={`font-bold ${isWarning ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {st.capacityPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        st.capacityPercent >= 90
                          ? 'bg-rose-500'
                          : st.capacityPercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, st.capacityPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950">
                    <span className="text-slate-400 block text-[10px]">ระดับน้ำปัจจุบัน</span>
                    <span className="text-slate-100 font-bold">{st.waterLevelM} ม.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950">
                    <span className="text-slate-400 block text-[10px]">ระดับตลิ่ง</span>
                    <span className="text-slate-300 font-bold">{st.bankLevelM} ม.</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                อัปเดต: {new Date(st.recordedAt).toLocaleTimeString('th-TH')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
