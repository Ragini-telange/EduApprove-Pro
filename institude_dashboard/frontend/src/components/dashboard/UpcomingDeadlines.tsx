import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { DeadlineItem } from '../../types';

interface UpcomingDeadlinesProps {
  deadlines: DeadlineItem[];
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ deadlines }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
          <p className="text-xs text-slate-500">Key institutional compliance timeline</p>
        </div>
        <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-3.5 flex-1">
        {deadlines.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No impending deadlines</p>
        ) : (
          deadlines.map((item) => {
            const isUrgent = item.days_remaining <= 7;
            const isWarning = item.days_remaining <= 15;

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 shrink-0">
                  <span className="text-xs font-bold leading-tight">
                    {item.date_display.split(' ')[0]}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-indigo-600">
                    {item.date_display.split(' ')[1]}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {item.days_text}
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
