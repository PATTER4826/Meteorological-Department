/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Air Quality (PM2.5 / PM10 / AQI) Center
 */

import React from 'react';
import { AirQualityData } from '../../shared/types.ts';
import { Wind, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface AirQualityViewProps {
  airQuality: AirQualityData[];
}

export const AirQualityView: React.FC<AirQualityViewProps> = ({ airQuality }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/40 border border-orange-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wind className="w-5 h-5 text-orange-400" />
            ศูนย์เฝ้าระวังคุณภาพอากาศและฝุ่น PM2.5 (Air Quality & CAMS PCD)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจวัดความเข้มข้นของฝุ่นละอองขนาดเล็ก PM2.5 และ PM10 ตามเกณฑ์มาตรฐานกรมควบคุมมลพิษ (PCD) และดาวเทียม CAMS
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-orange-400">
          มาตรฐานไทย: ปลอดภัย &lt; 37.5 µg/m³
        </div>
      </div>

      {/* PCD Legend Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <span className="font-bold text-emerald-400 block">0 - 25.0 µg/m³</span>
            <span className="text-[11px] text-slate-400">คุณภาพดีมาก / ดี</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-yellow-500/30 flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 shrink-0" />
          <div>
            <span className="font-bold text-yellow-400 block">25.1 - 37.5 µg/m³</span>
            <span className="text-[11px] text-slate-400">ปานกลาง (เริ่มเฝ้าระวัง)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/30 flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
          <div>
            <span className="font-bold text-orange-400 block">37.6 - 75.0 µg/m³</span>
            <span className="text-[11px] text-slate-400">เริ่มมีผลต่อสุขภาพ (สีส้ม)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30 flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
          <div>
            <span className="font-bold text-rose-400 block">&gt; 75.1 µg/m³</span>
            <span className="text-[11px] text-slate-400">มีผลต่อสุขภาพ (สีแดง)</span>
          </div>
        </div>
      </div>

      {/* Stations Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {airQuality.map((aq) => {
          const isHigh = aq.pm25 > 37.5;
          const isCritical = aq.pm25 > 75.0;

          return (
            <div
              key={aq.province}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">จ.{aq.province}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: aq.colorCode, boxShadow: `0 0 8px ${aq.colorCode}` }}
                  />
                </div>
                <span className="text-xs text-slate-400 block mt-0.5 line-clamp-1">
                  {aq.stationName}
                </span>

                <div className="my-4 flex items-baseline gap-2">
                  <span
                    className="text-4xl font-extrabold font-mono tracking-tight"
                    style={{ color: aq.colorCode }}
                  >
                    {aq.pm25.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">µg/m³</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                  <span className="text-slate-400 block text-[10px]">สถานะคุณภาพอากาศ:</span>
                  <span className="font-semibold" style={{ color: aq.colorCode }}>
                    {aq.statusText}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>US-AQI: {aq.aqi}</span>
                <span>อัปเดต: {new Date(aq.recordedAt).toLocaleTimeString('th-TH')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
