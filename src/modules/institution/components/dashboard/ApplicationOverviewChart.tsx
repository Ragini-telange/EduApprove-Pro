import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ApplicationSummaryData } from '../../types';

interface ApplicationOverviewChartProps {
  data: ApplicationSummaryData;
}

export const ApplicationOverviewChart: React.FC<ApplicationOverviewChartProps> = ({ data }) => {
  const chartData = data.distribution.filter((item) => item.count > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Application Overview</h3>
          <p className="text-xs text-slate-500">Distribution by current workflow stage</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
          Total: {data.total}
        </span>
      </div>

      <div className="relative flex-1 min-h-[220px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
                      <span className="font-semibold">{item.name}:</span> {item.count} applications
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900">{data.total}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Active
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 pt-3 border-t border-slate-100">
        {data.distribution.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}</span>
            </div>
            <span className="font-semibold text-slate-800 ml-1">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
