import React, { useMemo, useState } from 'react';
import { LabOrder, formatDateTime } from '../types/clinical';
import { labFlagTextClass, labPriorityTextClass, labStatusTextClass } from './clinicalStyles';

interface LabsQueueViewProps {
  labOrders: LabOrder[];
  globalSearch: string;
  onSelectPatient: (patientId: string) => void;
  onAdvanceInLab: (labId: string) => void;
  onEnterResult: (order: LabOrder) => void;
}

type LabFilter = 'All' | 'Pending' | 'Flagged' | 'Resulted';

export const LabsQueueView: React.FC<LabsQueueViewProps> = ({
  labOrders,
  globalSearch,
  onSelectPatient,
  onAdvanceInLab,
  onEnterResult,
}) => {
  const [filter, setFilter] = useState<LabFilter>('All');
  const queryText = globalSearch.trim().toLowerCase();

  const filtered = useMemo(() => {
    return labOrders
      .filter((l) => {
        if (filter === 'Pending' && l.status !== 'Ordered' && l.status !== 'In Lab') return false;
        if (filter === 'Flagged' && l.flag !== 'Abnormal' && l.flag !== 'Critical') return false;
        if (filter === 'Resulted' && l.status !== 'Resulted') return false;
        if (!queryText) return true;
        return (
          l.patientName.toLowerCase().includes(queryText) ||
          l.testName.toLowerCase().includes(queryText) ||
          l.category.toLowerCase().includes(queryText)
        );
      })
      .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
  }, [labOrders, filter, queryText]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Diagnostics & Laboratory Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {filtered.length} diagnostic orders displayed
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(['All', 'Pending', 'Flagged', 'Resulted'] as LabFilter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No diagnostic orders match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                  <th className="py-2.5 px-5">Ordered</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Diagnostic Study</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Result</th>
                  <th className="py-2.5 px-4">Flag</th>
                  <th className="py-2.5 px-5 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((lab) => {
                  const isTerminal = lab.status === 'Resulted' || lab.status === 'Cancelled';
                  return (
                    <tr key={lab.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateTime(lab.orderedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectPatient(lab.patientId)}
                          className="font-medium text-teal-800 hover:underline text-left cursor-pointer"
                        >
                          {lab.patientName}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{lab.testName}</div>
                        <div className="text-xs text-slate-500">{lab.category}</div>
                      </td>
                      <td className={`py-3 px-4 text-xs whitespace-nowrap ${labPriorityTextClass(lab.priority)}`}>
                        {lab.priority}
                      </td>
                      <td className={`py-3 px-4 text-xs whitespace-nowrap ${labStatusTextClass(lab.status)}`}>
                        {lab.status}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-900">
                        {lab.resultValue || '—'}
                      </td>
                      <td className={`py-3 px-4 text-xs whitespace-nowrap ${labFlagTextClass(lab.flag)}`}>
                        {lab.flag}
                      </td>
                      <td className="py-3 px-5 text-right text-xs whitespace-nowrap">
                        {!isTerminal ? (
                          <div className="inline-flex items-center gap-3">
                            {lab.status === 'Ordered' && (
                              <button
                                type="button"
                                onClick={() => onAdvanceInLab(lab.id)}
                                className="text-sky-700 hover:text-sky-900 font-medium cursor-pointer"
                              >
                                In Lab
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEnterResult(lab)}
                              className="text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
                            >
                              Enter Result
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectPatient(lab.patientId)}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            Chart
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
