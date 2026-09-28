/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Earthquake Seismology Monitor (USGS & TMD)
 */

import React from 'react';
import { EarthquakeData, NormalizedEvent } from '../../shared/types.ts';
import { Activity, MapPin, Clock, ExternalLink, ShieldAlert, ArrowDown } from 'lucide-react';

interface EarthquakeViewProps {
  earthquakes: EarthquakeData[];
  events: NormalizedEvent[];
  onSelectEvent: (event: NormalizedEvent) => void;
}

export const EarthquakeView: React.FC<EarthquakeViewProps> = ({ earthquakes, events, onSelectEvent }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            ศูนย์เฝ้าระวังแผ่นดินไหวในประเทศไทยและภูมิภาคใกล้เคียง (USGS & TMD Seismology)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจจับคลื่นไหวสะเทือนแบบอัตโนมัติ คำนวณระยะห่างถึงแนวพรมแดนไทย (Haversine KM) และประเมินความเสี่ยงต่อโครงสร้างอาคารสูง
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400">
          ความถี่ตรวจสอบ: ทุก 60 วินาที
        </div>
      </div>

      {/* Earthquakes Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
        <h3 className="font-bold text-slate-100 text-sm">
          รายการแผ่นดินไหวล่าสุดในรัศมีเฝ้าระวัง (ตรวจพบ {earthquakes.length} รายการ)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="pb-3 font-semibold">ขนาด (Magnitude)</th>
                <th className="pb-3 font-semibold">สถานที่ / จุดศูนย์กลาง</th>
                <th className="pb-3 font-semibold">ระยะห่างถึงประเทศไทย</th>
                <th className="pb-3 font-semibold">ความลึก (Depth)</th>
                <th className="pb-3 font-semibold">เวลาที่เกิดเหตุ (UTC+7)</th>
                <th className="pb-3 font-semibold text-right">แหล่งข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {earthquakes.map((eq) => {
                const isClose = eq.distanceToThailandKm <= 350;
                const isSignificant = eq.magnitude >= 4.5;

                return (
                  <tr key={eq.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg ${
                          eq.magnitude >= 5.5
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : eq.magnitude >= 4.0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        M {eq.magnitude.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      <div className="flex flex-col">
                        <span>{eq.place}</span>
                        <span className="text-[11px] text-slate-400">
                          พิกัด: {eq.latitude.toFixed(3)}, {eq.longitude.toFixed(3)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`font-mono font-medium ${
                          isClose ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {eq.distanceToThailandKm} กม.
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        ใกล้ จ.{eq.nearestThaiProvince}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {eq.depth} กม.
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {new Date(eq.occurredAt).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={eq.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                      >
                        USGS
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
