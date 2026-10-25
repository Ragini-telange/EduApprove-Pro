import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { 
  RegionalGeoMetric, 
  MapLayerId, 
  AlertHealthStatus 
} from '../../types/authority';
import { useLanguage } from '../../context/LanguageContext';
import { 
  RotateCcw, 
  Layers, 
  Table as TableIcon, 
  Map as MapIcon, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  Info,
  CalendarCheck,
  FileSpreadsheet
} from 'lucide-react';

interface RegionalAlertMapProps {
  metrics: RegionalGeoMetric[];
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  activeLayer: MapLayerId;
  onLayerChange: (layer: MapLayerId) => void;
}

const LAYER_CONFIG: {
  id: MapLayerId;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'pendency',
    labelKey: 'map.layer_pendency',
    defaultLabel: 'Application Pendency',
    icon: Clock,
    description: 'Volume of applications currently in-flight and awaiting statutory progress.',
  },
  {
    id: 'overdue',
    labelKey: 'map.layer_overdue',
    defaultLabel: 'Overdue Applications',
    icon: AlertCircle,
    description: 'Cases that have exceeded citizen charter processing SLA deadlines.',
  },
  {
    id: 'evc',
    labelKey: 'map.layer_evc',
    defaultLabel: 'EVC Scheduling & Reporting',
    icon: CalendarCheck,
    description: 'Expert Visiting Committee inspections delayed or pending scheduling.',
  },
  {
    id: 'compliance',
    labelKey: 'map.layer_compliance',
    defaultLabel: 'Compliance Submissions',
    icon: AlertTriangle,
    description: 'Outstanding deficiencies communicated to institutions awaiting correction.',
  },
  {
    id: 'expiring_docs',
    labelKey: 'map.layer_expiring_docs',
    defaultLabel: 'Expiring & Expired Documents',
    icon: FileSpreadsheet,
    description: 'Statutory land, fire safety NOC, building stability, and accreditation documents expiring soon.',
  },
];

const HEALTH_COLORS: Record<AlertHealthStatus, { bg: string; border: string; ring: string; text: string; hex: string }> = {
  green: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-200',
    ring: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-700',
    hex: '#059669',
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-200',
    ring: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-700',
    hex: '#D97706',
  },
  red: {
    bg: 'bg-rose-600',
    border: 'border-rose-200',
    ring: 'rgba(225, 29, 72, 0.4)',
    text: 'text-rose-700',
    hex: '#E11D48',
  },
  grey: {
    bg: 'bg-slate-400',
    border: 'border-slate-200',
    ring: 'rgba(148, 163, 184, 0.2)',
    text: 'text-slate-600',
    hex: '#94A3B8',
  },
};

export const RegionalAlertMap: React.FC<RegionalAlertMapProps> = ({
  metrics,
  selectedRegionId,
  onSelectRegion,
  activeLayer,
  onLayerChange,
}) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // Center of India
  const INDIA_CENTER: [number, number] = [22.8, 79.5];
  const DEFAULT_ZOOM = 4.8;

  // Initialize Map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: INDIA_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: true,
      });

      // Tile layer from OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | AICTE SmartAssist',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Don't destroy map on every render, only when switching away or unmounting
    };
  }, [viewMode]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when activeLayer, metrics, or selectedRegionId change
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current || !markersLayerGroupRef.current) return;

    const layerGroup = markersLayerGroupRef.current;
    layerGroup.clearLayers();

    metrics.forEach((metric) => {
      const health = metric.layerHealth[activeLayer] || 'grey';
      const colorDef = HEALTH_COLORS[health];
      const metricVal = metric.layerMetricValue[activeLayer] ?? 0;
      const isSelected = selectedRegionId === metric.regionId;

      // Custom DivIcon HTML
      const iconHtml = `
        <div class="custom-marker-pin" style="width: 44px; height: 44px;">
          <div class="marker-ring-pulse" style="background-color: ${colorDef.ring};"></div>
          <div style="
            width: 36px; 
            height: 36px; 
            border-radius: 50%; 
            background: ${colorDef.hex}; 
            color: #ffffff; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: ${isSelected ? '3px solid #F59E0B' : '2px solid #ffffff'};
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            <span>${metricVal}</span>
          </div>
          <div style="
            position: absolute;
            bottom: -18px;
            white-space: nowrap;
            background: rgba(11, 37, 69, 0.9);
            color: #ffffff;
            font-size: 10px;
            font-weight: 600;
            padding: 1px 6px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            ${metric.regionName}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-region-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([metric.lat, metric.lng], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div style="padding: 12px 14px; min-width: 220px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px;">
            <strong style="color: #F59E0B; font-size: 13px;">${metric.regionName} Region</strong>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${colorDef.hex}; color: #fff; font-weight: 700; text-transform: uppercase;">
              ${health}
            </span>
          </div>
          <div style="font-size: 11px; color: #E2E8F0; margin-bottom: 8px;">
            <strong>HQ:</strong> ${metric.headquarters}<br/>
            <strong>RO:</strong> ${metric.responsibleOfficer}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 11px;">
            <div><span style="color: #94A3B8;">Pending:</span> <strong>${metric.pendingApplications}</strong></div>
            <div><span style="color: #94A3B8;">Overdue:</span> <strong style="color: #F87171;">${metric.overdueApplications}</strong></div>
            <div><span style="color: #94A3B8;">EVC Delay:</span> <strong>${metric.evcPendingOrDelayed}</strong></div>
            <div><span style="color: #94A3B8;">Deficiencies:</span> <strong>${metric.complianceDeficiencies}</strong></div>
          </div>
          <div style="font-size: 10px; color: #CBD5E1; text-align: center; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 6px;">
            Click to inspect regional cases & audit records
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectRegion(metric.regionId);
      });

      marker.addTo(layerGroup);
    });
  }, [viewMode, metrics, activeLayer, selectedRegionId, onSelectRegion]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(INDIA_CENTER, DEFAULT_ZOOM, {
        animate: true,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Map Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-aicte-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{t('map.title')}</span>
                <span className="text-[10px] bg-aicte-50 text-aicte-800 border border-aicte-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  OpenStreetMap • Live
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Interactive geographic risk surveillance across all 8 AICTE regional jurisdictions
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Reset Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'table' : 'map')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-colors"
            title="Toggle between Map and Screen-Reader Accessible Tabular View"
          >
            {viewMode === 'map' ? (
              <>
                <TableIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('map.switch_to_table')}</span>
              </>
            ) : (
              <>
                <MapIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('map.switch_to_map')}</span>
              </>
            )}
          </button>

          {viewMode === 'map' && (
            <button
              onClick={handleResetView}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-colors"
              title="Reset India Map View"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('map.reset_view')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Selector Bar */}
      <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200/80 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" /> Map Layers:
        </span>
        {LAYER_CONFIG.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isActive
                  ? 'bg-aicte-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{t(layer.labelKey) || layer.defaultLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Map Canvas / Accessible Table View */}
      {viewMode === 'map' ? (
        <div className="relative">
          {/* Leaflet DOM container */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-[520px] bg-slate-100 z-0" 
            style={{ minHeight: '520px' }}
          />

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-md max-w-xs text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200/70 pb-1.5">
              <span>Map Legend & Thresholds</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="text-slate-700">
                  <strong>Green:</strong> Within statutory timeline / normal SLA
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                <span className="text-slate-700">
                  <strong>Amber:</strong> Approaching deadline / moderate delay
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
                <span className="text-slate-700">
                  <strong>Red:</strong> SLA Overdue / Urgent escalation
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></span>
                <span className="text-slate-700">
                  <strong>Grey:</strong> Zero cases or insufficient data
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
              Active Layer: <strong>{LAYER_CONFIG.find(l => l.id === activeLayer)?.defaultLabel}</strong>. Click any region circle to view cases.
            </div>
          </div>
        </div>
      ) : (
        /* Screen-Reader Friendly Accessible Tabular View */
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Accessible Tabular View — Regional Geographic Case Allocations
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              8 Jurisdictions Active
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-200 text-slate-700">
                <th className="py-2.5 px-3 font-semibold">Region & Headquarters</th>
                <th className="py-2.5 px-3 font-semibold">Responsible RO</th>
                <th className="py-2.5 px-3 font-semibold text-center">Total Cases</th>
                <th className="py-2.5 px-3 font-semibold text-center">Pending</th>
                <th className="py-2.5 px-3 font-semibold text-center">Overdue</th>
                <th className="py-2.5 px-3 font-semibold text-center">EVC Delayed</th>
                <th className="py-2.5 px-3 font-semibold text-center">Deficiencies</th>
                <th className="py-2.5 px-3 font-semibold text-center">Active Layer Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.map((m) => {
                const health = m.layerHealth[activeLayer] || 'grey';
                const isSelected = selectedRegionId === m.regionId;
                return (
                  <tr 
                    key={m.regionId}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-amber-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{m.regionName}</div>
                      <div className="text-[11px] text-slate-500">{m.headquarters}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{m.responsibleOfficer}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.officerEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {m.totalApplications}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-amber-700">
                      {m.pendingApplications}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-700">
                      {m.overdueApplications}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      {m.evcPendingOrDelayed}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      {m.complianceDeficiencies}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        health === 'green' ? 'bg-emerald-100 text-emerald-800' :
                        health === 'amber' ? 'bg-amber-100 text-amber-800' :
                        health === 'red' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {health.toUpperCase()} ({m.layerMetricValue[activeLayer]})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectRegion(m.regionId)}
                        className="px-2.5 py-1 bg-aicte-900 hover:bg-aicte-800 text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Inspect Region
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
