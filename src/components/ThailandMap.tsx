/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Leaflet Thailand Interactive Map with Dark/Street/Satellite Themes,
 * Multi-Hazard Layers, Station Telemetry & Province Search
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type {
  NormalizedEvent,
  EventType,
  SeverityLevel,
  WeatherObservationData,
  FloodStationData,
  AirQualityData,
  EarthquakeData,
  StormData
} from '../../shared/types.ts';
import { THAILAND_PROVINCES } from '../../shared/types.ts';
import {
  Layers,
  ShieldAlert,
  Waves,
  Wind,
  Activity,
  CloudRain,
  Flame,
  Eye,
  ExternalLink,
  Search,
  MapPin,
  Crosshair,
  Compass,
  LifeBuoy
} from 'lucide-react';

interface ThailandMapProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
  weather?: WeatherObservationData[];
  floods?: FloodStationData[];
  airQuality?: AirQualityData[];
  earthquakes?: EarthquakeData[];
  storms?: StormData[];
  onOpenEmergencyGuide?: (type: EventType) => void;
}

export const ThailandMap: React.FC<ThailandMapProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  weather = [],
  floods = [],
  airQuality = [],
  earthquakes = [],
  storms = [],
  onOpenEmergencyGuide
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Basemap style state
  const [basemapStyle, setBasemapStyle] = useState<'dark' | 'osm' | 'satellite'>('dark');

  // Layer filter state
  const [layers, setLayers] = useState({
    ALERTS: true,
    EARTHQUAKE: true,
    FLOOD: true,
    WEATHER: true,
    PM25: true,
    STORM: true
  });

  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'ALL'>('ALL');
  const [provinceSearch, setProvinceSearch] = useState('');
  const [activeStationCount, setActiveStationCount] = useState(0);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy prior map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [13.736717, 100.523186],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false
    });

    // Dark Matter tile layer default
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Invalidate size after container renders
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);

    // ResizeObserver to ensure Leaflet renders full tiles whenever container size changes
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Basemap Tile Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    let newUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; CARTO &copy; OpenStreetMap';

    if (basemapStyle === 'osm') {
      newUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (basemapStyle === 'satellite') {
      newUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }

    const newLayer = L.tileLayer(newUrl, {
      attribution,
      subdomains: basemapStyle === 'dark' ? 'abcd' : 'abc',
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [basemapStyle]);

  // 3. Render Multi-Hazard & Station Markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    const layerGroup = markersLayerRef.current;
    layerGroup.clearLayers();
    let totalMarkers = 0;

    // --- A. Render Normalized Disaster Events (Alerts) ---
    if (layers.ALERTS) {
      const filteredEvents = events.filter((e) => {
        if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
        return true;
      });

      for (const event of filteredEvents) {
        if (!event.latitude || !event.longitude) continue;
        totalMarkers++;

        const isSelected = selectedEvent?.id === event.id;

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
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
              ${
                event.severity === 'CRITICAL'
                  ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: ${pulseColor}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                  : ''
              }
              <div style="
                position: relative;
                width: 34px;
                height: 34px;
                border-radius: 9999px;
                background: #0f172a;
                border: 2px solid ${color};
                box-shadow: 0 0 16px ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                cursor: pointer;
                transform: ${isSelected ? 'scale(1.35)' : 'scale(1)'};
                transition: transform 0.2s ease;
              ">
                ${iconSymbol}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([event.latitude, event.longitude], { icon: customIcon });

        // Add impact circle buffer
        if (event.severity === 'CRITICAL' || event.severity === 'WARNING') {
          const radiusMeters = event.type === 'EARTHQUAKE' ? 45000 : event.type === 'FLOOD' ? 30000 : 25000;
          L.circle([event.latitude, event.longitude], {
            radius: radiusMeters,
            color,
            weight: 1.5,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: 0.12
          }).addTo(layerGroup);
        }

        // Popup Content
        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; color: #f1f5f9; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 700; color: ${color}; font-size: 11px; text-transform: uppercase;">● ${event.severity}</span>
              <span style="background: #1e293b; color: #94a3b8; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${event.type}</span>
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #ffffff; line-height: 1.3; margin-bottom: 4px;">
              ${event.title}
            </div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px;">
              📍 จ.${event.province} • ${new Date(event.occurredAt).toLocaleTimeString('th-TH')}
            </div>
            <div style="color: #cbd5e1; font-size: 11px; line-height: 1.4; margin-bottom: 10px; max-height: 60px; overflow-y: auto;">
              ${event.description}
            </div>
            <div style="display: flex; gap: 6px;">
              <button id="btn-inspect-${event.id}" style="
                flex: 1;
                background: #e11d48;
                color: #ffffff;
                border: none;
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
              ">
                ดูรายละเอียด
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-${event.id}`);
          if (btn) {
            btn.onclick = () => onSelectEvent(event);
          }
        });

        marker.on('click', () => {
          onSelectEvent(event);
        });

        marker.addTo(layerGroup);
      }
    }

    // --- B. Render USGS Earthquakes ---
    if (layers.EARTHQUAKE) {
      for (const eq of earthquakes) {
        totalMarkers++;
        const customIcon = L.divIcon({
          className: 'eq-marker',
          html: `
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 9999px;
              background: #0f172a;
              border: 2px solid ${eq.magnitude >= 5.0 ? '#ef4444' : '#f59e0b'};
              box-shadow: 0 0 10px ${eq.magnitude >= 5.0 ? '#ef4444' : '#f59e0b'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: bold;
              color: ${eq.magnitude >= 5.0 ? '#fca5a5' : '#fde68a'};
              cursor: pointer;
            ">
              M${eq.magnitude.toFixed(1)}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([eq.latitude, eq.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-size: 12px; color: #f1f5f9;">
            <div style="font-weight: 700; color: #f59e0b; margin-bottom: 2px;">🌏 แผ่นดินไหว M ${eq.magnitude.toFixed(1)}</div>
            <div style="font-weight: 600; color: #ffffff;">${eq.place}</div>
            <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
              • ความลึก: <b>${eq.depth} กม.</b><br/>
              • ห่างจากไทย: <b>${eq.distanceToThailandKm} กม.</b> (ใกล้ จ.${eq.nearestThaiProvince})<br/>
              • เวลา: ${new Date(eq.occurredAt).toLocaleString('th-TH')}
            </div>
          </div>
        `);
        marker.addTo(layerGroup);
      }
    }

    // --- C. Render Flood River Stations ---
    if (layers.FLOOD) {
      for (const fl of floods) {
        totalMarkers++;
        const isHigh = fl.capacityPercent >= 85;
        const color = isHigh ? '#f97316' : '#38bdf8';

        const customIcon = L.divIcon({
          className: 'flood-marker',
          html: `
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 8px;
              background: #0f172a;
              border: 2px solid ${color};
              box-shadow: 0 0 8px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              cursor: pointer;
            ">
              🌊
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([fl.latitude, fl.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-size: 12px; color: #f1f5f9;">
            <div style="font-weight: 700; color: #38bdf8; margin-bottom: 2px;">🌊 สถานีวัดน้ำ: ${fl.stationName}</div>
            <div style="color: #94a3b8; font-size: 11px;">จ.${fl.province} • ลุ่มน้ำ${fl.basin} (${fl.river})</div>
            <div style="margin-top: 6px; font-size: 11px;">
              ความจุลำน้ำ: <b style="color: ${color}; font-size: 13px;">${fl.capacityPercent}%</b><br/>
              ระดับน้ำ: <b>${fl.waterLevelM} ม.</b> (ระดับตลิ่ง: ${fl.bankLevelM} ม.)
            </div>
          </div>
        `);
        marker.addTo(layerGroup);
      }
    }

    // --- D. Render Weather Stations ---
    if (layers.WEATHER) {
      for (const wx of weather) {
        totalMarkers++;
        const customIcon = L.divIcon({
          className: 'weather-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 2px;
              padding: 2px 6px;
              border-radius: 9999px;
              background: #0f172a;
              border: 1.5px solid #22d3ee;
              box-shadow: 0 0 6px rgba(34, 211, 238, 0.4);
              font-size: 11px;
              font-weight: bold;
              color: #ffffff;
              cursor: pointer;
            ">
              <span>🌦️</span>
              <span>${wx.temperature}°</span>
            </div>
          `,
          iconSize: [50, 24],
          iconAnchor: [25, 12]
        });

        const marker = L.marker([wx.latitude, wx.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-size: 12px; color: #f1f5f9;">
            <div style="font-weight: 700; color: #22d3ee; margin-bottom: 2px;">🌦️ สภาพอากาศ จ.${wx.province}</div>
            <div style="font-weight: 600; font-size: 14px; margin: 4px 0;">${wx.temperature}°C (${wx.condition})</div>
            <div style="color: #94a3b8; font-size: 11px;">
              • ฝนสะสม: <b>${wx.rainMmPerHour} มม./ชม.</b><br/>
              • ความเร็วลม: <b>${wx.windSpeed} กม./ชม.</b><br/>
              • ความชื้น: <b>${wx.humidity}%</b> • ความกด: <b>${wx.pressure} hPa</b>
            </div>
          </div>
        `);
        marker.addTo(layerGroup);
      }
    }

    // --- E. Render PM2.5 Air Quality Stations ---
    if (layers.PM25) {
      for (const aq of airQuality) {
        totalMarkers++;
        const customIcon = L.divIcon({
          className: 'aq-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 2px;
              padding: 2px 6px;
              border-radius: 9999px;
              background: #0f172a;
              border: 1.5px solid ${aq.colorCode};
              box-shadow: 0 0 8px ${aq.colorCode};
              font-size: 11px;
              font-weight: bold;
              color: ${aq.colorCode};
              cursor: pointer;
            ">
              <span>🌫️</span>
              <span>${Math.round(aq.pm25)}</span>
            </div>
          `,
          iconSize: [48, 24],
          iconAnchor: [24, 12]
        });

        const marker = L.marker([aq.latitude, aq.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-size: 12px; color: #f1f5f9;">
            <div style="font-weight: 700; color: ${aq.colorCode}; margin-bottom: 2px;">🌫️ คุณภาพอากาศ: จ.${aq.province}</div>
            <div style="font-size: 14px; font-weight: 800; color: ${aq.colorCode}; margin: 4px 0;">
              PM2.5: ${aq.pm25.toFixed(1)} µg/m³
            </div>
            <div style="color: #cbd5e1; font-size: 11px;">
              สถานะ: <b>${aq.statusText}</b> (US-AQI: ${aq.aqi})
            </div>
          </div>
        `);
        marker.addTo(layerGroup);
      }
    }

    // --- F. Render Storms ---
    if (layers.STORM) {
      for (const st of storms) {
        totalMarkers++;
        const customIcon = L.divIcon({
          className: 'storm-marker',
          html: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 9999px;
              background: #3b0764;
              border: 2px solid #a855f7;
              box-shadow: 0 0 12px #a855f7;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              animation: spin 8s linear infinite;
              cursor: pointer;
            ">
              🌀
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([st.currentLat, st.currentLon], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-size: 12px; color: #f1f5f9;">
            <div style="font-weight: 700; color: #c084fc; margin-bottom: 2px;">🌀 ${st.name}</div>
            <div style="color: #ffffff; font-weight: 600;">${st.category}</div>
            <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
              • ลมสูงสุด: <b>${st.maxWindSpeedKmh} กม./ชม.</b><br/>
              • ความกดอากาศ: <b>${st.centralPressureHpa} hPa</b><br/>
              • ระยะห่างถึงไทย: <b>${st.distanceToThailandKm} กม.</b>
            </div>
          </div>
        `);
        marker.addTo(layerGroup);
      }
    }

    setActiveStationCount(totalMarkers);
  }, [events, weather, floods, airQuality, earthquakes, storms, layers, filterSeverity, selectedEvent, onSelectEvent]);

  // 4. Fly to selected event when changed
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current && selectedEvent.latitude && selectedEvent.longitude) {
      mapInstanceRef.current.flyTo([selectedEvent.latitude, selectedEvent.longitude], 9, {
        duration: 1.2
      });
    }
  }, [selectedEvent]);

  // Quick Focus Regions
  const handleFocusRegion = (region: 'ALL' | 'NORTH' | 'CENTRAL' | 'NORTHEAST' | 'SOUTH' | 'EAST') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    switch (region) {
      case 'ALL':
        map.flyTo([13.736717, 100.523186], 6, { duration: 1.0 });
        break;
      case 'NORTH':
        map.flyTo([18.7883, 98.9853], 8, { duration: 1.0 });
        break;
      case 'CENTRAL':
        map.flyTo([13.7563, 100.5018], 9, { duration: 1.0 });
        break;
      case 'NORTHEAST':
        map.flyTo([16.4322, 102.8236], 8, { duration: 1.0 });
        break;
      case 'SOUTH':
        map.flyTo([8.5, 99.5], 7, { duration: 1.0 });
        break;
      case 'EAST':
        map.flyTo([13.0, 101.5], 8, { duration: 1.0 });
        break;
    }
  };

  // Province Search
  const handleSearchProvince = (provName: string) => {
    if (!mapInstanceRef.current || !provName.trim()) return;
    const clean = provName.trim().replace('จังหวัด', '').replace('จ.', '');
    const foundKey = Object.keys(THAILAND_PROVINCES).find((k) => k.includes(clean));

    if (foundKey && THAILAND_PROVINCES[foundKey]) {
      const p = THAILAND_PROVINCES[foundKey];
      mapInstanceRef.current.flyTo([p.lat, p.lon], 10, { duration: 1.2 });
      setProvinceSearch('');
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 flex-1" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Multi-Hazard Layer Toggles */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 text-slate-400 font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            เลเยอร์ ({activeStationCount})
          </span>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, ALERTS: !prev.ALERTS }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              layers.ALERTS ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🚨</span> เตือนภัย ({events.length})
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, EARTHQUAKE: !prev.EARTHQUAKE }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              layers.EARTHQUAKE ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌏</span> แผ่นดินไหว
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, FLOOD: !prev.FLOOD }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              layers.FLOOD ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌊</span> น้ำท่วม/ลุ่มน้ำ
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, WEATHER: !prev.WEATHER }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              layers.WEATHER ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌦️</span> สภาพอากาศ
          </button>

          <button
            onClick={() => setLayers((prev) => ({ ...prev, PM25: !prev.PM25 }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              layers.PM25 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌫️</span> PM2.5
          </button>
        </div>

        {/* Right: Province Search & Basemap Switcher */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Province Search Input */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <input
              type="text"
              value={provinceSearch}
              onChange={(e) => setProvinceSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchProvince(provinceSearch)}
              placeholder="ค้นหาจังหวัด เช่น เชียงใหม่..."
              className="bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs px-2 py-1 w-32 sm:w-44 focus:outline-none"
            />
            {provinceSearch && (
              <button
                onClick={() => handleSearchProvince(provinceSearch)}
                className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-semibold text-[11px]"
              >
                บินไป
              </button>
            )}
          </div>

          {/* Basemap Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-xs">
            <button
              onClick={() => setBasemapStyle('dark')}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                basemapStyle === 'dark' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌑 มืด
            </button>
            <button
              onClick={() => setBasemapStyle('osm')}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                basemapStyle === 'osm' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🗺️ ถนน
            </button>
            <button
              onClick={() => setBasemapStyle('satellite')}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                basemapStyle === 'satellite' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛰️ ดาวเทียม
            </button>
          </div>
        </div>
      </div>

      {/* Region Focus Quick Bar (Top Left below controls) */}
      <div className="absolute top-20 left-4 z-[400] flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl text-xs hidden md:flex">
        <span className="text-[11px] text-slate-400 px-2 font-medium">โฟกัสภาค:</span>
        <button
          onClick={() => handleFocusRegion('ALL')}
          className="px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          🇹🇭 ทั่วประเทศ
        </button>
        <button
          onClick={() => handleFocusRegion('NORTH')}
          className="px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          ภาคเหนือ
        </button>
        <button
          onClick={() => handleFocusRegion('CENTRAL')}
          className="px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          ภาคกลาง/กทม.
        </button>
        <button
          onClick={() => handleFocusRegion('NORTHEAST')}
          className="px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          ภาคอีสาน
        </button>
        <button
          onClick={() => handleFocusRegion('SOUTH')}
          className="px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          ภาคใต้
        </button>
        <button
          onClick={() => handleFocusRegion('EAST')}
          className="px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          ภาคตะวันออก
        </button>
      </div>

      {/* Map Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs shadow-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            คำอธิบายสัญลักษณ์ (Map Legend)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">LIVE GPS</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
            <span>วิกฤต (Critical Alert)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f97316]" />
            <span>เตือนภัย (Warning)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌏</span>
            <span>จุดศูนย์กลางแผ่นดินไหว</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌊</span>
            <span>สถานีวัดระดับน้ำลุ่มน้ำ</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌦️</span>
            <span>เรดาร์ฝน/อุณหภูมิ</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌫️</span>
            <span>สถานีตรวจวัด PM2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};
