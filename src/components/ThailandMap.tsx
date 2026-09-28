/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Leaflet Thailand Interactive Map with Dark Theme & Multi-Layer Hazards
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { NormalizedEvent, EventType, SeverityLevel } from '../../shared/types.ts';
import { Layers, ShieldAlert, Waves, Wind, Activity, CloudRain, Flame, Eye, ExternalLink } from 'lucide-react';

interface ThailandMapProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
}

export const ThailandMap: React.FC<ThailandMapProps> = ({ events, selectedEvent, onSelectEvent }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer filter state
  const [layers, setLayers] = useState({
    EARTHQUAKE: true,
    FLOOD: true,
    STORM: true,
    HEAVY_RAIN: true,
    PM25: true,
    WILDFIRE: true
  });

  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'ALL'>('ALL');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map centered on Thailand
    const map = L.map(mapContainerRef.current, {
      center: [13.736717, 100.523186],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false
    });

    // Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers whenever events or layer filters change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    const layerGroup = markersLayerRef.current;
    layerGroup.clearLayers();

    const filteredEvents = events.filter((e) => {
      // Check category layer
      if (e.type === 'EARTHQUAKE' && !layers.EARTHQUAKE) return false;
      if (e.type === 'FLOOD' && !layers.FLOOD) return false;
      if (e.type === 'STORM' && !layers.STORM) return false;
      if (['HEAVY_RAIN', 'THUNDERSTORM'].includes(e.type) && !layers.HEAVY_RAIN) return false;
      if (['PM25', 'AIR_POLLUTION'].includes(e.type) && !layers.PM25) return false;
      if (['WILDFIRE', 'HEAT'].includes(e.type) && !layers.WILDFIRE) return false;

      // Check severity filter
      if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;

      return true;
    });

    for (const event of filteredEvents) {
      if (!event.latitude || !event.longitude) continue;

      const isSelected = selectedEvent?.id === event.id;

      // Color coding
      let color = '#3b82f6';
      let pulseColor = 'rgba(59, 130, 246, 0.4)';
      if (event.severity === 'CRITICAL') {
        color = '#ef4444';
        pulseColor = 'rgba(239, 68, 68, 0.6)';
      } else if (event.severity === 'WARNING') {
        color = '#f97316';
        pulseColor = 'rgba(249, 115, 22, 0.5)';
      } else if (event.severity === 'WATCH') {
        color = '#eab308';
        pulseColor = 'rgba(234, 179, 8, 0.4)';
      }

      // Icon symbol based on event type
      let iconSymbol = '⚠️';
      if (event.type === 'EARTHQUAKE') iconSymbol = '🌏';
      else if (event.type === 'FLOOD') iconSymbol = '🌊';
      else if (event.type === 'STORM') iconSymbol = '🌀';
      else if (event.type === 'HEAVY_RAIN' || event.type === 'THUNDERSTORM') iconSymbol = '🌧️';
      else if (event.type === 'PM25') iconSymbol = '🌫️';
      else if (event.type === 'HEAT') iconSymbol = '☀️';

      const customIcon = L.divIcon({
        className: 'disaster-map-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
            ${
              event.severity === 'CRITICAL'
                ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: ${pulseColor}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              position: relative;
              width: 32px;
              height: 32px;
              border-radius: 9999px;
              background: #0f172a;
              border: 2px solid ${color};
              box-shadow: 0 0 14px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'};
              transition: transform 0.2s ease;
            ">
              ${iconSymbol}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([event.latitude, event.longitude], { icon: customIcon });

      // Add risk impact radius circle for flood or high PM2.5 or earthquake epicenter
      if (event.severity === 'CRITICAL' || event.severity === 'WARNING') {
        const radiusMeters = event.type === 'EARTHQUAKE' ? 45000 : event.type === 'FLOOD' ? 25000 : 20000;
        L.circle([event.latitude, event.longitude], {
          radius: radiusMeters,
          color,
          weight: 1,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.12
        }).addTo(layerGroup);
      }

      marker.on('click', () => {
        onSelectEvent(event);
      });

      marker.addTo(layerGroup);
    }
  }, [events, layers, filterSeverity, selectedEvent, onSelectEvent]);

  // Center on selected event if changed
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedEvent.latitude, selectedEvent.longitude], 9, {
        duration: 1.2
      });
    }
  }, [selectedEvent]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Header Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Layer Toggles Pill Container */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 text-slate-400 font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            Layers
          </span>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, EARTHQUAKE: !prev.EARTHQUAKE }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              layers.EARTHQUAKE ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌏</span> แผ่นดินไหว
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, FLOOD: !prev.FLOOD }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              layers.FLOOD ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌊</span> น้ำท่วม
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, STORM: !prev.STORM }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              layers.STORM ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌀</span> พายุ
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, HEAVY_RAIN: !prev.HEAVY_RAIN }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              layers.HEAVY_RAIN ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌧️</span> ฝนตกหนัก
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, PM25: !prev.PM25 }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              layers.PM25 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌫️</span> PM2.5
          </button>
        </div>

        {/* Severity Filter */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-xs">
          {(['ALL', 'CRITICAL', 'WARNING', 'WATCH'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                    : sev === 'WARNING'
                    ? 'bg-amber-600 text-white'
                    : sev === 'WATCH'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev === 'ALL' ? 'ทั้งหมด' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Map Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-xs shadow-xl hidden sm:flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          ระดับความรุนแรง (Severity)
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
          <span>วิกฤต (CRITICAL)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f97316]" />
          <span>เตือนภัย (WARNING)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]" />
          <span>เฝ้าระวัง (WATCH)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>ข้อมูลทั่วไป (INFORMATION)</span>
        </div>
      </div>
    </div>
  );
};
