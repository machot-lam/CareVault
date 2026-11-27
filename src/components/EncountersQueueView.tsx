import React, { useMemo, useState } from 'react';
import { Encounter, EncounterStatus, formatDateTime } from '../types/clinical';
import { encounterStatusTextClass } from './clinicalStyles';

interface EncountersQueueViewProps {
  encounters: Encounter[];
  globalSearch: string;
  onSelectPatient: (patientId: string) => void;
  onEditEncounter: (encounter: Encounter) => void;
}

const FILTERS: ('All' | EncounterStatus)[] = ['All', 'In Progress', 'Scheduled', 'Completed', 'Cancelled'];

export const EncountersQueueView: React.FC<EncountersQueueViewProps> = ({
  encounters,
  globalSearch,
  onSelectPatient,
  onEditEncounter,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | EncounterStatus>('All');
  const queryText = globalSearch.trim().toLowerCase();

  const filtered = useMemo(() => {
    return encounters
      .filter((e) => {
        if (statusFilter !== 'All' && e.status !== statusFilter) return false;
        if (!queryText) return true;
        return (
          e.patientName.toLowerCase().includes(queryText) ||
          e.patientMrn.toLowerCase().includes(queryText) ||
          e.chiefComplaint.toLowerCase().includes(queryText)
        );
      })
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  }, [encounters, statusFilter, queryText]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Clinical Schedule & SOAP Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {filtered.length} encounters displayed
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {FILTERS.map((status) => (
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No encounters match the selected filter. Open any patient chart to schedule or document a SOAP encounter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                  <th className="py-2.5 px-5">Scheduled</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Chief Complaint</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((enc) => {
                  const isLocked = enc.status === 'Completed' || enc.status === 'Cancelled';
                  return (
                    <tr key={enc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateTime(enc.scheduledAt)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectPatient(enc.patientId)}
                          className="font-medium text-teal-800 hover:underline text-left cursor-pointer"
                        >
                          {enc.patientName}
                        </button>
                        <div className="text-xs font-mono text-slate-500">{enc.patientMrn}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {enc.encounterType}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm truncate">
                        {enc.chiefComplaint}
                      </td>
                      <td className={`py-3 px-4 text-xs whitespace-nowrap ${encounterStatusTextClass(enc.status)}`}>
                        {enc.status === 'Completed' ? 'Completed · Locked' : enc.status}
                      </td>
                      <td className="py-3 px-5 text-right text-xs whitespace-nowrap">
                        {!isLocked ? (
                          <button
                            type="button"
                            onClick={() => onEditEncounter(enc)}
                            className="font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
                          >
                            Document SOAP
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectPatient(enc.patientId)}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            View Chart
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
