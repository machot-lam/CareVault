import React, { useMemo } from 'react';
import { ArrowUpRight, Database, Plus } from 'lucide-react';
import { Encounter, LabOrder, Patient, VitalReading, calculateAge, formatDateTime, formatShortDate } from '../types/clinical';
import { careStatusTextClass, encounterStatusTextClass, labFlagTextClass, labPriorityTextClass } from './clinicalStyles';

interface OverviewViewProps {
  patients: Patient[];
  encounters: Encounter[];
  vitals: VitalReading[];
  labOrders: LabOrder[];
  loading: boolean;
  seeding: boolean;
  onSelectPatient: (patientId: string) => void;
  onOpenNewPatient: () => void;
  onLoadSamplePanel: () => void;
  onNavigateView: (view: 'patients' | 'encounters' | 'labs') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  patients,
  encounters,
  vitals,
  labOrders,
  loading,
  seeding,
  onSelectPatient,
  onOpenNewPatient,
  onLoadSamplePanel,
  onNavigateView,
}) => {
  const stats = useMemo(() => {
    const activeCount = patients.filter((p) => p.careStatus !== 'Discharged').length;
    const criticalInpatient = patients.filter(
      (p) => p.careStatus === 'Critical' || p.careStatus === 'Inpatient'
    ).length;
    const openEncounters = encounters.filter(
      (e) => e.status === 'Scheduled' || e.status === 'In Progress'
    ).length;
    const pendingOrCriticalLabs = labOrders.filter(
      (l) => l.status === 'Ordered' || l.status === 'In Lab' || l.flag === 'Critical' || l.flag === 'Abnormal'
    ).length;
    return { activeCount, criticalInpatient, openEncounters, pendingOrCriticalLabs };
  }, [patients, encounters, labOrders]);

  const priorityPatients = useMemo(() => {
    const rank = { Critical: 0, Inpatient: 1, Active: 2, Discharged: 3 };
    return [...patients]
      .sort((a, b) => rank[a.careStatus] - rank[b.careStatus])
      .slice(0, 6);
  }, [patients]);

  const openEncounterList = useMemo(
    () =>
      [...encounters]
        .filter((e) => e.status === 'In Progress' || e.status === 'Scheduled')
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .slice(0, 5),
    [encounters]
  );

  const attentionLabs = useMemo(
    () =>
      [...labOrders]
        .filter((l) => l.status !== 'Cancelled')
        .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
        .slice(0, 5),
    [labOrders]
  );

  const latestVitalsByPatient = useMemo(() => {
    const map = new Map<string, VitalReading>();
    const sorted = [...vitals].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    for (const v of sorted) {
      if (!map.has(v.patientId)) map.set(v.patientId, v);
    }
    return map;
  }, [vitals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 max-w-2xl mx-auto mt-6">
        <p className="text-xs font-medium text-teal-800 mb-2">Clinical Panel Onboarding</p>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Your patient vault is ready for clinical records
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Register your first patient manually or load a structured 5-patient clinical panel with vitals trajectories, active SOAP notes, prescriptions, and lab orders to explore every CareVault workflow immediately.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenNewPatient}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register First Patient
          </button>
          <button
            type="button"
            onClick={onLoadSamplePanel}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Database className="w-4 h-4 text-teal-700" />
            {seeding ? 'Loading Clinical Panel...' : 'Load Sample Clinical Panel'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-column Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Active Panel</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {stats.activeCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {patients.length} total registered records
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Inpatient & Critical</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {stats.criticalInpatient}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Requiring daily ward surveillance
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Open Encounters</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {stats.openEncounters}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Scheduled or awaiting SOAP sign-off
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Lab Attention Queue</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {stats.pendingOrCriticalLabs}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Pending collection or flagged results
          </div>
        </div>
      </div>

      {/* Priority Patient Census Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Clinical Priority Census</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordered by acuity with latest recorded hemodynamic vitals
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateView('patients')}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Full Registry
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                <th className="py-2.5 px-5">MRN</th>
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-4">Primary Diagnosis & Unit</th>
                <th className="py-2.5 px-4">Latest Vitals</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-5 text-right">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {priorityPatients.map((p) => {
                const latest = latestVitalsByPatient.get(p.id);
                return (
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
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {calculateAge(p.dateOfBirth)}y · {p.sex} · {p.bloodType}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-900 truncate">{p.primaryDiagnosis || '—'}</div>
                      <div className="text-xs text-slate-500 truncate">{p.wardOrClinic}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {latest
                        ? `${latest.systolicBp}/${latest.diastolicBp} mmHg · ${latest.heartRate} bpm · ${latest.spo2}%`
                        : 'No vitals logged'}
                    </td>
                    <td className={`py-3 px-4 text-xs whitespace-nowrap ${careStatusTextClass(p.careStatus)}`}>
                      {p.careStatus}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatShortDate(p.lastVisitDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Operational Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Encounters */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Active & Upcoming Encounters</h2>
            <button
              type="button"
              onClick={() => onNavigateView('encounters')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              All Encounters
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {openEncounterList.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">No open or scheduled encounters right now.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {openEncounterList.map((enc) => (
                <button
                  key={enc.id}
                  type="button"
                  onClick={() => onSelectPatient(enc.patientId)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer block"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {enc.patientName}
                    </span>
                    <span className={`text-xs whitespace-nowrap ${encounterStatusTextClass(enc.status)}`}>
                      {enc.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 truncate">{enc.chiefComplaint}</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                    {enc.patientMrn} · {enc.encounterType} · {formatDateTime(enc.scheduledAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Diagnostic Lab Queue */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Recent Diagnostic Orders</h2>
            <button
              type="button"
              onClick={() => onNavigateView('labs')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              Diagnostics Queue
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {attentionLabs.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">No laboratory orders recorded.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {attentionLabs.map((lab) => (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => onSelectPatient(lab.patientId)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer block"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {lab.testName}
                    </span>
                    <span className={`text-xs whitespace-nowrap ${labFlagTextClass(lab.flag)}`}>
                      {lab.flag}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-1 text-xs">
                    <span className="text-slate-600 truncate">
                      {lab.patientName} · <span className={labPriorityTextClass(lab.priority)}>{lab.priority}</span>
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums shrink-0">
                      {lab.resultValue || lab.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
