/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Regional Weather & Rain Radar Monitor (Open-Meteo & TMD)
 */

import React from 'react';
import { WeatherObservationData, StormData } from '../../shared/types.ts';
import { CloudRain, Wind, Thermometer, Droplets, Gauge, AlertTriangle, Compass } from 'lucide-react';

interface WeatherViewProps {
  weather: WeatherObservationData[];
  storms: StormData[];
}

export const WeatherView: React.FC<WeatherViewProps> = ({ weather, storms }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            สถานีตรวจวัดสภาพอากาศและเรดาร์ฝนรายภูมิภาค (Regional Weather Radar)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจวัดอุณหภูมิ, ความชื้นสัมพัทธ์, ความเร็วลม, ความกดอากาศ และปริมาณฝนสะสมแบบรายชั่วโมง
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
          ความถี่ตรวจสอบ: ทุก 3 นาที
        </div>
      </div>

      {/* Tropical Cyclone / Storm Warning if active */}
      {storms.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              🌀 พายุหมุนเขตร้อนและหย่อมความกดอากาศต่ำที่กำลังติดตาม (Tropical Systems)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-900/50 text-purple-200">
              {storms.length} ระบบ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storms.map((st) => (
              <div key={st.id} className="p-4 rounded-xl bg-slate-950 border border-purple-800/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-sm">{st.name}</h4>
                  <span className="text-xs text-purple-300 font-mono">
                    ลมสูงสุด {st.maxWindSpeedKmh} กม./ชม.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] block">ความกดอากาศ</span>
                    <span className="text-slate-200 font-semibold">{st.centralPressureHpa} hPa</span>
                  </div>
                  <div>
                    <span className="text-[10px] block">ระยะห่างถึงไทย</span>
                    <span className="text-amber-400 font-semibold">{st.distanceToThailandKm} กม.</span>
                  </div>
                  <div>
                    <span className="text-[10px] block">สถานะ</span>
                    <span className="text-purple-400 font-semibold">{st.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Stations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {weather.map((wx) => (
          <div
            key={wx.province}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">จ.{wx.province}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{wx.provinceEn}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                  {wx.condition}
                </span>
              </div>

              <div className="my-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-100 font-mono">
                  {wx.temperature}°
                </span>
                <span className="text-xs text-slate-400">เซลเซียส (C)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950 flex items-center gap-2 text-slate-300">
                  <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">ความชื้น</span>
                    <span className="font-mono font-semibold">{wx.humidity}%</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 flex items-center gap-2 text-slate-300">
                  <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">ความเร็วลม</span>
                    <span className="font-mono font-semibold">{wx.windSpeed} กม./ชม.</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 flex items-center gap-2 text-slate-300">
                  <CloudRain className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">ปริมาณฝน</span>
                    <span className="font-mono font-semibold">{wx.rainMmPerHour} มม./ชม.</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 flex items-center gap-2 text-slate-300">
                  <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">ความกดอากาศ</span>
                    <span className="font-mono font-semibold">{wx.pressure} hPa</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
              ตรวจวัดเมื่อ: {new Date(wx.recordedAt).toLocaleTimeString('th-TH')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
