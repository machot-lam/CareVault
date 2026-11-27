import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Edit3,
  FileText,
  FlaskConical,
  Pill,
  Trash2,
} from 'lucide-react';
import {
  Encounter,
  LabOrder,
  Medication,
  MedicationStatus,
  Patient,
  VitalReading,
  calculateAge,
  formatDateTime,
  formatShortDate,
} from '../types/clinical';
import { VitalsTrendChart } from './VitalsTrendChart';
import {
  careStatusTextClass,
  encounterStatusTextClass,
  labFlagTextClass,
  labPriorityTextClass,
  labStatusTextClass,
  medicationStatusTextClass,
} from './clinicalStyles';

type ChartTab = 'summary' | 'encounters' | 'medications' | 'labs';

interface PatientChartViewProps {
  patient: Patient;
  encounters: Encounter[];
  vitals: VitalReading[];
  medications: Medication[];
  labOrders: LabOrder[];
  onBack: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
  onRecordVitals: () => void;
  onDeleteVital: (vitalId: string) => void;
  onNewEncounter: () => void;
  onEditEncounter: (encounter: Encounter) => void;
  onPrescribeMedication: () => void;
  onUpdateMedicationStatus: (medicationId: string, status: MedicationStatus) => void;
  onOrderLab: () => void;
  onAdvanceLabInLab: (labId: string) => void;
  onEnterLabResult: (order: LabOrder) => void;
  onCancelLabOrder: (labId: string) => void;
}

export const PatientChartView: React.FC<PatientChartViewProps> = ({
  patient,
  encounters,
  vitals,
  medications,
  labOrders,
  onBack,
  onEditPatient,
  onDeletePatient,
  onRecordVitals,
  onDeleteVital,
  onNewEncounter,
  onEditEncounter,
  onPrescribeMedication,
  onUpdateMedicationStatus,
  onOrderLab,
  onAdvanceLabInLab,
  onEnterLabResult,
  onCancelLabOrder,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('summary');

  const sortedVitals = useMemo(
    () => [...vitals].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    [vitals]
  );
  const latestVital = sortedVitals[0];

  const sortedEncounters = useMemo(
    () => [...encounters].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    [encounters]
  );

  const sortedMeds = useMemo(
    () => [...medications].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [medications]
  );

  const sortedLabs = useMemo(
    () => [...labOrders].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt)),
    [labOrders]
  );

  return (
    <div className="space-y-6">
      {/* Top Return & Clinical Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Patient Registry
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onEditPatient(patient)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Demographics
            </button>
            <button
              type="button"
              onClick={() => onDeletePatient(patient)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-slate-300 hover:bg-red-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Record
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <span className={`text-sm ${careStatusTextClass(patient.careStatus)}`}>
                {patient.careStatus}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
              <span className="text-slate-900 font-medium">{patient.mrn}</span>
              <span aria-hidden="true">·</span>
              <span>DOB {patient.dateOfBirth} ({calculateAge(patient.dateOfBirth)} yrs)</span>
              <span aria-hidden="true">·</span>
              <span>{patient.sex}</span>
              <span aria-hidden="true">·</span>
              <span>Blood {patient.bloodType}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">{patient.wardOrClinic}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">Attending: {patient.attendingPhysician}</span>
            </div>

            {patient.primaryDiagnosis && (
              <p className="mt-3 text-sm text-slate-800">
                <span className="text-slate-500">Primary Diagnosis:</span>{' '}
                <span className="font-medium">{patient.primaryDiagnosis}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRecordVitals}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Activity className="w-3.5 h-3.5 text-teal-700" />
              Record Vitals
            </button>
            <button
              type="button"
              onClick={onNewEncounter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              New SOAP Note
            </button>
            <button
              type="button"
              onClick={onPrescribeMedication}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              Prescribe
            </button>
            <button
              type="button"
              onClick={onOrderLab}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Order Lab
            </button>
          </div>
        </div>

        {/* Allergy Notice */}
        {patient.allergies.length > 0 && (
          <div className="mt-5 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-900">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>
              <strong>Documented Allergies:</strong> {patient.allergies.join(' · ')}
            </span>
          </div>
        )}
      </div>

      {/* Segmented Chart Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit overflow-x-auto max-w-full">
        {(
          [
            { id: 'summary', label: 'Summary & Vitals', count: vitals.length },
            { id: 'encounters', label: 'Encounters & SOAP', count: encounters.length },
            { id: 'medications', label: 'Medications', count: medications.length },
            { id: 'labs', label: 'Diagnostics & Labs', count: labOrders.length },
          ] as { id: ChartTab; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label} <span className="font-mono text-slate-400 ml-1 tabular-nums">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Summary & Vitals */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Latest Vitals Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Latest Physiological Snapshot</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                  {latestVital
                    ? `Recorded ${formatDateTime(latestVital.recordedAt)} by ${latestVital.recordedBy}`
                    : 'No vital signs recorded yet'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRecordVitals}
                className="text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                + Log New Vitals
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-3 border-t border-slate-200">
              <div>
                <div className="text-xs text-slate-500">Blood Pressure</div>
                <div className="mt-1 text-lg font-semibold font-mono text-slate-900 tabular-nums">
                  {latestVital ? `${latestVital.systolicBp}/${latestVital.diastolicBp}` : '—'}
                </div>
                <div className="text-xs text-slate-400">mmHg</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Heart Rate</div>
                <div className="mt-1 text-lg font-semibold font-mono text-slate-900 tabular-nums">
                  {latestVital ? latestVital.heartRate : '—'}
                </div>
                <div className="text-xs text-slate-400">bpm</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">SpO2</div>
                <div className="mt-1 text-lg font-semibold font-mono text-slate-900 tabular-nums">
                  {latestVital ? `${latestVital.spo2}%` : '—'}
                </div>
                <div className="text-xs text-slate-400">room air / O2</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Temperature</div>
                <div className="mt-1 text-lg font-semibold font-mono text-slate-900 tabular-nums">
                  {latestVital ? `${latestVital.temperatureC}°C` : '—'}
                </div>
                <div className="text-xs text-slate-400">oral / tympanic</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Resp. Rate</div>
                <div className="mt-1 text-lg font-semibold font-mono text-slate-900 tabular-nums">
                  {latestVital ? latestVital.respiratoryRate : '—'}
                </div>
                <div className="text-xs text-slate-400">breaths/min</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Body Weight</div>
                <div className="mt-1 text-lg font-semibold font-mono text-slate-900 tabular-nums">
                  {latestVital ? `${latestVital.weightKg} kg` : '—'}
                </div>
                <div className="text-xs text-slate-400">measured</div>
              </div>
            </div>
          </div>

          <VitalsTrendChart vitals={vitals} />

          {/* Demographics & Clinical Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Clinical Care Summary</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {patient.notesSummary || 'No longitudinal clinical summary recorded for this patient yet.'}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Contact Phone:</span>{' '}
                  <span className="font-mono text-slate-900">{patient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="text-slate-900">{patient.email || '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Address:</span>{' '}
                  <span className="text-slate-900">{patient.address || '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-2">Emergency & Coverage</h2>
                <dl className="space-y-2.5 text-xs">
                  <div>
                    <dt className="text-slate-500">Emergency Contact</dt>
                    <dd className="text-slate-900 font-medium mt-0.5">
                      {patient.emergencyContactName || 'Not documented'}
                    </dd>
                    {patient.emergencyContactPhone && (
                      <dd className="font-mono text-slate-600 mt-0.5">{patient.emergencyContactPhone}</dd>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500">Insurance Carrier</dt>
                    <dd className="text-slate-900 font-medium mt-0.5">
                      {patient.insuranceProvider || 'Self-pay / Unspecified'}
                    </dd>
                    {patient.insuranceMemberId && (
                      <dd className="font-mono text-slate-600 mt-0.5">ID: {patient.insuranceMemberId}</dd>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500">Last Clinical Visit</dt>
                    <dd className="font-mono text-slate-900 mt-0.5">{formatShortDate(patient.lastVisitDate)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Vitals History Log */}
          {sortedVitals.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Recorded Vitals Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/60">
                      <th className="py-2.5 px-5">Timestamp</th>
                      <th className="py-2.5 px-3">BP (mmHg)</th>
                      <th className="py-2.5 px-3">HR</th>
                      <th className="py-2.5 px-3">RR</th>
                      <th className="py-2.5 px-3">Temp</th>
                      <th className="py-2.5 px-3">SpO2</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-4">Recorded By</th>
                      <th className="py-2.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {sortedVitals.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-5 text-slate-700 whitespace-nowrap">
                          {formatDateTime(v.recordedAt)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 font-medium">
                          {v.systolicBp}/{v.diastolicBp}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{v.heartRate}</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.respiratoryRate}</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.temperatureC}°C</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.spo2}%</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.weightKg} kg</td>
                        <td className="py-2.5 px-4 font-sans text-slate-600">{v.recordedBy}</td>
                        <td className="py-2.5 px-5 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => onDeleteVital(v.id)}
                            className="text-slate-400 hover:text-red-700 cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Encounters & SOAP Notes */}
      {activeTab === 'encounters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Clinical Encounters & SOAP Documentation</h2>
            <button
              type="button"
              onClick={onNewEncounter}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              + New Encounter
            </button>
          </div>

          {sortedEncounters.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <div className="text-sm font-medium text-slate-900">No encounters recorded</div>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Start an outpatient visit, inpatient round, or telehealth SOAP note.
              </p>
              <button
                type="button"
                onClick={onNewEncounter}
                className="px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                Create First Encounter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEncounters.map((enc) => {
                const isLocked = enc.status === 'Completed' || enc.status === 'Cancelled';
                return (
                  <div key={enc.id} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-sm font-semibold text-slate-900">{enc.chiefComplaint}</span>
                          <span className={`text-xs ${encounterStatusTextClass(enc.status)}`}>
                            {enc.status === 'Completed' ? 'Completed · Locked' : enc.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                          {enc.encounterType} · {formatDateTime(enc.scheduledAt)} · {enc.clinicianName}
                        </div>
                      </div>
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => onEditEncounter(enc)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Edit SOAP Note
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                      <div>
                        <div className="font-medium text-slate-500 mb-1">Subjective</div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {enc.subjectiveNote || '—'}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium text-slate-500 mb-1">Objective</div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {enc.objectiveNote || '—'}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium text-slate-500 mb-1">Assessment</div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {enc.assessmentNote || '—'}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium text-slate-500 mb-1">Plan</div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {enc.planNote || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Medications */}
      {activeTab === 'medications' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Medication Administration & Prescriptions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.allergies.length > 0
                  ? `Allergy alert: ${patient.allergies.join(', ')}`
                  : 'No known drug allergies documented'}
              </p>
            </div>
            <button
              type="button"
              onClick={onPrescribeMedication}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              + Prescribe Medication
            </button>
          </div>

          {sortedMeds.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No active or historical medications on file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-5">Medication</th>
                    <th className="py-2.5 px-4">Dosage & Route</th>
                    <th className="py-2.5 px-4">Frequency</th>
                    <th className="py-2.5 px-4">Start Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedMeds.map((med) => {
                    const isTerminal = med.status === 'Completed' || med.status === 'Discontinued';
                    return (
                      <tr key={med.id} className="hover:bg-slate-50">
                        <td className="py-3 px-5">
                          <div className="font-medium text-slate-900">{med.drugName}</div>
                          {med.instructions && (
                            <div className="text-xs text-slate-500 mt-0.5">{med.instructions}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                          {med.dosage} · {med.route}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">{med.frequency}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {med.startDate}
                        </td>
                        <td className={`py-3 px-4 text-xs whitespace-nowrap ${medicationStatusTextClass(med.status)}`}>
                          {med.status}
                        </td>
                        <td className="py-3 px-5 text-right text-xs whitespace-nowrap">
                          {!isTerminal ? (
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateMedicationStatus(
                                    med.id,
                                    med.status === 'Active' ? 'On Hold' : 'Active'
                                  )
                                }
                                className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                              >
                                {med.status === 'Active' ? 'Hold' : 'Resume'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateMedicationStatus(med.id, 'Completed')}
                                className="text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateMedicationStatus(med.id, 'Discontinued')}
                                className="text-red-700 hover:text-red-900 font-medium cursor-pointer"
                              >
                                Discontinue
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">Locked</span>
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
      )}

      {/* Tab 4: Diagnostics & Labs */}
      {activeTab === 'labs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Diagnostic Orders & Laboratory Results</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track specimen progress, reference intervals, and clinical flags
              </p>
            </div>
            <button
              type="button"
              onClick={onOrderLab}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              + Order Diagnostic
            </button>
          </div>

          {sortedLabs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No diagnostic or laboratory studies ordered for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-5">Test / Study</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Result & Reference</th>
                    <th className="py-2.5 px-4">Flag</th>
                    <th className="py-2.5 px-5 text-right">Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedLabs.map((lab) => {
                    const isTerminal = lab.status === 'Resulted' || lab.status === 'Cancelled';
                    return (
                      <tr key={lab.id} className="hover:bg-slate-50">
                        <td className="py-3 px-5">
                          <div className="font-medium text-slate-900">{lab.testName}</div>
                          <div className="text-xs text-slate-500 font-mono tabular-nums">
                            {lab.category} · {formatDateTime(lab.orderedAt)}
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-xs whitespace-nowrap ${labPriorityTextClass(lab.priority)}`}>
                          {lab.priority}
                        </td>
                        <td className={`py-3 px-4 text-xs whitespace-nowrap ${labStatusTextClass(lab.status)}`}>
                          {lab.status}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-slate-900 font-medium">
                            {lab.resultValue || 'Awaiting specimen/result'}
                          </div>
                          {lab.referenceRange && (
                            <div className="text-xs text-slate-500">Ref: {lab.referenceRange}</div>
                          )}
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
                                  onClick={() => onAdvanceLabInLab(lab.id)}
                                  className="text-sky-700 hover:text-sky-900 font-medium cursor-pointer"
                                >
                                  Mark In Lab
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onEnterLabResult(lab)}
                                className="text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
                              >
                                Enter Result
                              </button>
                              <button
                                type="button"
                                onClick={() => onCancelLabOrder(lab.id)}
                                className="text-slate-500 hover:text-red-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">Finalized</span>
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
      )}
    </div>
  );
};
