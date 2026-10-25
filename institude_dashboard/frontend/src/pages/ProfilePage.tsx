import React, { useState, useEffect } from 'react';
import { institutionService } from '../services/institutionService';
import { Institution } from '../types';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  MapPin,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [inst, setInst] = useState<Institution | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await institutionService.getInstitution(user?.id || user?.institutionCode);
        setInst(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header Profile Hero */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {inst?.name ? inst.name.slice(0, 3).toUpperCase() : 'INS'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {inst?.name || 'Institution Admin'}
              </h2>
              <Badge variant="success" dot>
                {inst?.approval_status || 'Approved Institution'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              AICTE Institution ID:{' '}
              <span className="font-mono font-bold text-indigo-700">
                {inst?.code || inst?.id || 'AICTE-INS-10245'}
              </span>{' '}
              &bull; Established: {inst?.establishment_year || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg">
            AICTE Western Regional Office
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutional Coordinates */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Institutional Sanction Data
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Institution Category</span>
              <span className="font-semibold text-slate-800">{inst?.category || 'Engineering & Technology'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Institution Management</span>
              <span className="font-semibold text-slate-800">{inst?.institution_type || 'Government'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Institutional Code</span>
              <span className="font-mono font-semibold text-slate-800">{inst?.code || inst?.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Current Academic Cycle</span>
              <span className="font-semibold text-indigo-700">{inst?.current_academic_year || '2026-2027'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">AICTE Approval Status</span>
              <span className="font-semibold text-emerald-600">Extension of Approval (EOA) Active</span>
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Campus Location &amp; Administration
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Campus Address</span>
              <span className="font-semibold text-slate-800 text-right">
                {inst?.address || 'Main Campus'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">District &amp; State</span>
              <span className="font-semibold text-slate-800">
                {inst?.district || 'District'}, {inst?.state || 'State'} - {inst?.pincode || 'Pincode'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Official Email</span>
              <span className="font-mono font-semibold text-indigo-700">{inst?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Principal Office Phone</span>
              <span className="font-mono font-semibold text-slate-800">{inst?.phone || '+91 20 2550 7000'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">AISHE Statutory Code</span>
              <span className="font-mono font-semibold text-slate-800">C-41584</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
