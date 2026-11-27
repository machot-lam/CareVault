import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { CareStatus, Patient, calculateAge, formatShortDate } from '../types/clinical';
import { careStatusTextClass } from './clinicalStyles';

interface PatientsRegistryViewProps {
  patients: Patient[];
  globalSearch: string;
  onSelectPatient: (patientId: string) => void;
  onOpenNewPatient: () => void;
}

const STATUS_FILTERS: ('All' | CareStatus)[] = ['All', 'Active', 'Inpatient', 'Critical', 'Discharged'];

export const PatientsRegistryView: React.FC<PatientsRegistryViewProps> = ({
  patients,
  globalSearch,
  onSelectPatient,
  onOpenNewPatient,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CareStatus>('All');

  const queryText = (localSearch || globalSearch).trim().toLowerCase();

  const filtered = useMemo(() => {
    return patients
      .filter((p) => {
        if (statusFilter !== 'All' && p.careStatus !== statusFilter) return false;
        if (!queryText) return true;
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return (
          fullName.includes(queryText) ||
          p.mrn.toLowerCase().includes(queryText) ||
          p.primaryDiagnosis.toLowerCase().includes(queryText) ||
          p.wardOrClinic.toLowerCase().includes(queryText)
        );
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [patients, statusFilter, queryText]);

  return (
    <div className="space-y-4">
      {/* Toolbar: Search + Segmented Status Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter by patient name, MRN, diagnosis, or unit..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-700"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="text-xs text-slate-500 tabular-nums">
            Showing <strong className="text-slate-900 font-semibold">{filtered.length}</strong> of{' '}
            {patients.length} registered patients
          </div>
          <button
            type="button"
            onClick={onOpenNewPatient}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New Patient
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-sm font-medium text-slate-900">No matching patient records</div>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {patients.length === 0
                ? 'Start by registering your first patient into CareVault.'
                : 'Adjust your search query or care status filter.'}
            </p>
            {patients.length === 0 && (
              <button
                type="button"
                onClick={onOpenNewPatient}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Register Patient
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                  <th className="py-2.5 px-5">MRN</th>
                  <th className="py-2.5 px-4">Patient Name</th>
                  <th className="py-2.5 px-4">DOB / Age</th>
                  <th className="py-2.5 px-4">Primary Diagnosis</th>
                  <th className="py-2.5 px-4">Allergies</th>
                  <th className="py-2.5 px-4">Care Status</th>
                  <th className="py-2.5 px-5 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {p.mrn}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {p.lastName}, {p.firstName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.sex} · {p.bloodType} · {p.wardOrClinic}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {p.dateOfBirth} ({calculateAge(p.dateOfBirth)}y)
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {p.primaryDiagnosis || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs max-w-[180px] truncate">
                      {p.allergies.length > 0 ? (
                        <span className="text-red-700 font-medium">{p.allergies.join(', ')}</span>
                      ) : (
                        <span className="text-slate-400">NKDA</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-xs whitespace-nowrap ${careStatusTextClass(p.careStatus)}`}>
                      {p.careStatus}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatShortDate(p.lastVisitDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
