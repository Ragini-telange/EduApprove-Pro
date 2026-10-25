import React, { useState, useEffect, useMemo } from 'react';
import type { 
  ApplicationRecord, 
  MapLayerId, 
  RegionalGeoMetric, 
  DelayIntelligenceData 
} from '../../types/authority';
import { authorityApi } from '../../services/authorityApi';
import { RegionalAlertMap } from './RegionalAlertMap';
import { RegionalDetailPanel } from './RegionalDetailPanel';
import { DelayIntelligenceSection } from './DelayIntelligenceSection';
import { PredictiveRiskSection } from './PredictiveRiskSection';

interface RegionalIntelligenceDashboardProps {
  applications: ApplicationRecord[];
  onSelectApplication: (app: ApplicationRecord) => void;
  onFilterByRegion: (regionName: string) => void;
}

export const RegionalIntelligenceDashboard: React.FC<RegionalIntelligenceDashboardProps> = ({
  applications,
  onSelectApplication,
  onFilterByRegion,
}) => {

  const [activeLayer, setActiveLayer] = useState<MapLayerId>('pendency');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('Western');
  const [activeViewSection, setActiveViewSection] = useState<'all' | 'map' | 'delays' | 'risk'>('all');

  // Compute metrics from current applications dataset
  const [regionalMetrics, setRegionalMetrics] = useState<RegionalGeoMetric[]>([]);
  const [delayData, setDelayData] = useState<DelayIntelligenceData | null>(null);

  useEffect(() => {
    async function loadRegionalData() {
      const geoMetrics = await authorityApi.getRegionalGeoMetrics(applications);
      const delays = await authorityApi.getDelayIntelligence(applications);
      setRegionalMetrics(geoMetrics);
      setDelayData(delays);
    }
    loadRegionalData();
  }, [applications]);

  const selectedMetric = useMemo(() => {
    return regionalMetrics.find(m => m.regionId === selectedRegionId) || regionalMetrics[0] || null;
  }, [regionalMetrics, selectedRegionId]);

  return (
    <div className="space-y-6">
      {/* Module Overview Banner & Sub-Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
              Geospatial Intelligence • Phase 3
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Regional Alert Map & Delay Intelligence
          </h1>
          <p className="text-xs text-slate-500">
            Real-time geospatial risk mapping, stage bottleneck analysis, and traceable statutory recommendations
          </p>
        </div>

        {/* Section View Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveViewSection('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeViewSection === 'all'
                ? 'bg-aicte-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unified View
          </button>
          <button
            onClick={() => setActiveViewSection('map')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeViewSection === 'map'
                ? 'bg-aicte-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alert Map & Dossier
          </button>
          <button
            onClick={() => setActiveViewSection('delays')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeViewSection === 'delays'
                ? 'bg-aicte-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delay Intelligence
          </button>
          <button
            onClick={() => setActiveViewSection('risk')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeViewSection === 'risk'
                ? 'bg-aicte-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Predictive Risk Engine
          </button>
        </div>
      </div>

      {/* SECTION 1: MAP & REGIONAL DOSSIER */}
      {(activeViewSection === 'all' || activeViewSection === 'map') && (
        <div className="space-y-6">
          <RegionalAlertMap
            metrics={regionalMetrics}
            selectedRegionId={selectedRegionId}
            onSelectRegion={(id) => setSelectedRegionId(id)}
            activeLayer={activeLayer}
            onLayerChange={(l) => setActiveLayer(l)}
          />

          <RegionalDetailPanel
            selectedMetric={selectedMetric}
            applications={applications}
            activeLayer={activeLayer}
            onSelectApplication={onSelectApplication}
            onFilterByRegion={onFilterByRegion}
          />
        </div>
      )}

      {/* SECTION 2: DELAY INTELLIGENCE & STAGE BOTTLENECKS */}
      {(activeViewSection === 'all' || activeViewSection === 'delays') && delayData && (
        <DelayIntelligenceSection
          data={delayData}
          onSelectApplication={onSelectApplication}
          applications={applications}
        />
      )}

      {/* SECTION 3: TRANSPARENT RULE-BASED RISK ENGINE */}
      {(activeViewSection === 'all' || activeViewSection === 'risk') && delayData && (
        <PredictiveRiskSection
          indicators={delayData.riskIndicators}
          onSelectApplication={onSelectApplication}
          applications={applications}
        />
      )}
    </div>
  );
};
