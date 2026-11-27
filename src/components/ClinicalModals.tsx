import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  BloodTypeOption,
  CareStatus,
  Clinician,
  Encounter,
  EncounterStatus,
  EncounterType,
  FIELD_LIMITS,
  LabCategory,
  LabFlag,
  LabOrder,
  LabPriority,
  MedicationRoute,
  Patient,
  SexOption,
  generateMrn,
  nowLocalDateTimeInput,
  todayIsoDate,
} from '../types/clinical';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  subtitle,
  onClose,
  maxWidthClass = 'max-w-2xl',
  children,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`w-full ${maxWidthClass} bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden my-auto`}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const inputCls =
  'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700';
const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5';

// 1. Patient Create / Edit Modal
interface PatientFormModalProps {
  initialPatient?: Patient | null;
  defaultClinicianName: string;
  onSave: (data: Omit<Patient, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  initialPatient,
  defaultClinicianName,
  onSave,
  onClose,
}) => {
  const [mrn, setMrn] = useState(initialPatient?.mrn || generateMrn());
  const [firstName, setFirstName] = useState(initialPatient?.firstName || '');
  const [lastName, setLastName] = useState(initialPatient?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialPatient?.dateOfBirth || '1985-01-15');
  const [sex, setSex] = useState<SexOption>(initialPatient?.sex || 'Female');
  const [bloodType, setBloodType] = useState<BloodTypeOption>(initialPatient?.bloodType || 'Unknown');
  const [phone, setPhone] = useState(initialPatient?.phone || '');
  const [email, setEmail] = useState(initialPatient?.email || '');
  const [address, setAddress] = useState(initialPatient?.address || '');
  const [emergencyContactName, setEmergencyContactName] = useState(initialPatient?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(initialPatient?.emergencyContactPhone || '');
  const [insuranceProvider, setInsuranceProvider] = useState(initialPatient?.insuranceProvider || '');
  const [insuranceMemberId, setInsuranceMemberId] = useState(initialPatient?.insuranceMemberId || '');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(initialPatient?.primaryDiagnosis || '');
  const [wardOrClinic, setWardOrClinic] = useState(initialPatient?.wardOrClinic || 'General Internal Medicine');
  const [attendingPhysician, setAttendingPhysician] = useState(
    initialPatient?.attendingPhysician || defaultClinicianName
  );
  const [careStatus, setCareStatus] = useState<CareStatus>(initialPatient?.careStatus || 'Active');
  const [allergiesText, setAllergiesText] = useState((initialPatient?.allergies || []).join(', '));
  const [notesSummary, setNotesSummary] = useState(initialPatient?.notesSummary || '');
  const [lastVisitDate, setLastVisitDate] = useState(initialPatient?.lastVisitDate || todayIsoDate());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setFormError('First name, last name, and primary phone number are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const allergies = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, FIELD_LIMITS.allergiesMaxCount);
      await onSave({
        mrn: mrn.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        sex,
        bloodType,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        insuranceProvider: insuranceProvider.trim(),
        insuranceMemberId: insuranceMemberId.trim(),
        primaryDiagnosis: primaryDiagnosis.trim(),
        wardOrClinic: wardOrClinic.trim(),
        attendingPhysician: attendingPhysician.trim(),
        careStatus,
        allergies,
        notesSummary: notesSummary.trim(),
        lastVisitDate,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save patient record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={initialPatient ? `Edit Patient Record — ${initialPatient.mrn}` : 'Register New Patient'}
      subtitle="Demographics, clinical placement, allergies, and emergency contact details"
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">{formError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Medical Record Number</label>
            <input
              type="text"
              value={mrn}
              onChange={(e) => setMrn(e.target.value.toUpperCase())}
              disabled={Boolean(initialPatient)}
              maxLength={FIELD_LIMITS.mrn}
              required
              className={`${inputCls} font-mono disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </div>
          <div>
            <label className={labelCls}>First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={FIELD_LIMITS.firstName}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={FIELD_LIMITS.lastName}
              required
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Date of Birth *</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Biological Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value as SexOption)} className={inputCls}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Blood Type</label>
            <select value={bloodType} onChange={(e) => setBloodType(e.target.value as BloodTypeOption)} className={inputCls}>
              {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as BloodTypeOption[]).map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Care Status</label>
            <select value={careStatus} onChange={(e) => setCareStatus(e.target.value as CareStatus)} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Critical">Critical</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Diagnosis</label>
            <input
              type="text"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              placeholder="e.g. Essential Hypertension, Type 2 Diabetes"
              maxLength={FIELD_LIMITS.primaryDiagnosis}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Allergies (comma-separated)</label>
            <input
              type="text"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="e.g. Penicillin, Latex (leave blank if NKDA)"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Ward / Outpatient Clinic</label>
            <input
              type="text"
              value={wardOrClinic}
              onChange={(e) => setWardOrClinic(e.target.value)}
              maxLength={FIELD_LIMITS.wardOrClinic}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Attending Physician</label>
            <input
              type="text"
              value={attendingPhysician}
              onChange={(e) => setAttendingPhysician(e.target.value)}
              maxLength={FIELD_LIMITS.attendingPhysician}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Last Clinical Visit</label>
            <input
              type="date"
              value={lastVisitDate}
              onChange={(e) => setLastVisitDate(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Phone Number *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(415) 555-0100"
              maxLength={FIELD_LIMITS.phone}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={FIELD_LIMITS.email}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Home Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={FIELD_LIMITS.address}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Emergency Contact Name</label>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              maxLength={FIELD_LIMITS.emergencyContactName}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Emergency Contact Phone</label>
            <input
              type="text"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              maxLength={FIELD_LIMITS.emergencyContactPhone}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Insurance Provider</label>
            <input
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              maxLength={FIELD_LIMITS.insuranceProvider}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Insurance Member ID</label>
            <input
              type="text"
              value={insuranceMemberId}
              onChange={(e) => setInsuranceMemberId(e.target.value)}
              maxLength={FIELD_LIMITS.insuranceMemberId}
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Clinical Summary Notes</label>
          <textarea
            rows={3}
            value={notesSummary}
            onChange={(e) => setNotesSummary(e.target.value)}
            maxLength={FIELD_LIMITS.notesSummary}
            placeholder="Brief longitudinal care overview, precautions, or discharge plan..."
            className={inputCls}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? 'Saving Record...' : initialPatient ? 'Save Changes' : 'Register Patient'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 2. Record Vitals Modal
interface VitalFormModalProps {
  patient: Patient;
  clinicianName: string;
  onSave: (data: {
    patientId: string;
    recordedAt: string;
    systolicBp: number;
    diastolicBp: number;
    heartRate: number;
    respiratoryRate: number;
    temperatureC: number;
    spo2: number;
    weightKg: number;
    recordedBy: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const VitalFormModal: React.FC<VitalFormModalProps> = ({
  patient,
  clinicianName,
  onSave,
  onClose,
}) => {
  const [recordedAt, setRecordedAt] = useState(nowLocalDateTimeInput());
  const [systolicBp, setSystolicBp] = useState(120);
  const [diastolicBp, setDiastolicBp] = useState(78);
  const [heartRate, setHeartRate] = useState(72);
  const [respiratoryRate, setRespiratoryRate] = useState(16);
  const [temperatureC, setTemperatureC] = useState(36.7);
  const [spo2, setSpo2] = useState(98);
  const [weightKg, setWeightKg] = useState(72.0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        patientId: patient.id,
        recordedAt,
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        temperatureC,
        spo2,
        weightKg,
        recordedBy: clinicianName,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Record Physiological Vitals"
      subtitle={`${patient.firstName} ${patient.lastName} · ${patient.mrn}`}
      onClose={onClose}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Observation Date & Time</label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
            className={`${inputCls} font-mono`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Systolic BP (mmHg)</label>
            <input
              type="number"
              min={40}
              max={280}
              value={systolicBp}
              onChange={(e) => setSystolicBp(Number(e.target.value))}
              required
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className={labelCls}>Diastolic BP (mmHg)</label>
            <input
              type="number"
              min={20}
              max={180}
              value={diastolicBp}
              onChange={(e) => setDiastolicBp(Number(e.target.value))}
              required
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className={labelCls}>Heart Rate (bpm)</label>
            <input
              type="number"
              min={20}
              max={240}
              value={heartRate}
              onChange={(e) => setHeartRate(Number(e.target.value))}
              required
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className={labelCls}>Resp. Rate (/min)</label>
            <input
              type="number"
              min={4}
              max={60}
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(Number(e.target.value))}
              required
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className={labelCls}>Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              min={30}
              max={44}
              value={temperatureC}
              onChange={(e) => setTemperatureC(Number(e.target.value))}
              required
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className={labelCls}>SpO2 (%)</label>
            <input
              type="number"
              min={50}
              max={100}
              value={spo2}
              onChange={(e) => setSpo2(Number(e.target.value))}
              required
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
        </div>

        <div className="max-w-[200px]">
          <label className={labelCls}>Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min={1}
            max={400}
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            required
            className={`${inputCls} font-mono tabular-nums`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Recording...' : 'Save Vitals'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 3. Encounter & SOAP Note Modal
interface EncounterFormModalProps {
  patient: Patient;
  initialEncounter?: Encounter | null;
  clinicianName: string;
  onCreate?: (data: Omit<Encounter, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (
    encounterId: string,
    updates: {
      status: EncounterStatus;
      subjectiveNote: string;
      objectiveNote: string;
      assessmentNote: string;
      planNote: string;
    }
  ) => Promise<void>;
  onClose: () => void;
}

export const EncounterFormModal: React.FC<EncounterFormModalProps> = ({
  patient,
  initialEncounter,
  clinicianName,
  onCreate,
  onUpdate,
  onClose,
}) => {
  const [encounterType, setEncounterType] = useState<EncounterType>(
    initialEncounter?.encounterType || 'Outpatient Visit'
  );
  const [status, setStatus] = useState<EncounterStatus>(initialEncounter?.status || 'In Progress');
  const [scheduledAt, setScheduledAt] = useState(
    initialEncounter?.scheduledAt || nowLocalDateTimeInput()
  );
  const [chiefComplaint, setChiefComplaint] = useState(initialEncounter?.chiefComplaint || '');
  const [subjectiveNote, setSubjectiveNote] = useState(initialEncounter?.subjectiveNote || '');
  const [objectiveNote, setObjectiveNote] = useState(initialEncounter?.objectiveNote || '');
  const [assessmentNote, setAssessmentNote] = useState(initialEncounter?.assessmentNote || '');
  const [planNote, setPlanNote] = useState(initialEncounter?.planNote || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initialEncounter && onUpdate) {
        await onUpdate(initialEncounter.id, {
          status,
          subjectiveNote,
          objectiveNote,
          assessmentNote,
          planNote,
        });
      } else if (onCreate) {
        await onCreate({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientMrn: patient.mrn,
          encounterType,
          status,
          scheduledAt,
          chiefComplaint: chiefComplaint.trim() || 'Clinical evaluation',
          subjectiveNote,
          objectiveNote,
          assessmentNote,
          planNote,
          clinicianName,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={initialEncounter ? 'Update Clinical Encounter & SOAP Note' : 'New Clinical Encounter'}
      subtitle={`${patient.firstName} ${patient.lastName} · ${patient.mrn}`}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Encounter Type</label>
            <select
              value={encounterType}
              disabled={Boolean(initialEncounter)}
              onChange={(e) => setEncounterType(e.target.value as EncounterType)}
              className={`${inputCls} disabled:bg-slate-100`}
            >
              <option value="Outpatient Visit">Outpatient Visit</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Inpatient Round">Inpatient Round</option>
              <option value="Urgent Triage">Urgent Triage</option>
              <option value="Telehealth">Telehealth</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              disabled={Boolean(initialEncounter)}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className={`${inputCls} font-mono disabled:bg-slate-100`}
            />
          </div>
          <div>
            <label className={labelCls}>Encounter Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EncounterStatus)}
              className={inputCls}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed (Sign & Lock)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Chief Complaint *</label>
          <input
            type="text"
            value={chiefComplaint}
            disabled={Boolean(initialEncounter)}
            onChange={(e) => setChiefComplaint(e.target.value)}
            maxLength={FIELD_LIMITS.chiefComplaint}
            placeholder="Primary reason for visit or clinical round..."
            required
            className={`${inputCls} disabled:bg-slate-100`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Subjective (History & Symptoms)</label>
            <textarea
              rows={3}
              value={subjectiveNote}
              onChange={(e) => setSubjectiveNote(e.target.value)}
              maxLength={FIELD_LIMITS.soapNote}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Objective (Exam & Findings)</label>
            <textarea
              rows={3}
              value={objectiveNote}
              onChange={(e) => setObjectiveNote(e.target.value)}
              maxLength={FIELD_LIMITS.soapNote}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Assessment (Clinical Impression)</label>
            <textarea
              rows={3}
              value={assessmentNote}
              onChange={(e) => setAssessmentNote(e.target.value)}
              maxLength={FIELD_LIMITS.soapNote}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Plan (Orders & Next Steps)</label>
            <textarea
              rows={3}
              value={planNote}
              onChange={(e) => setPlanNote(e.target.value)}
              maxLength={FIELD_LIMITS.soapNote}
              className={inputCls}
            />
          </div>
        </div>

        {status === 'Completed' && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Marking an encounter as Completed signs and locks the clinical note from further edits.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Saving Note...' : initialEncounter ? 'Save SOAP Update' : 'Create Encounter'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 4. Prescribe Medication Modal
interface MedicationFormModalProps {
  patient: Patient;
  clinicianName: string;
  onSave: (data: {
    patientId: string;
    drugName: string;
    dosage: string;
    frequency: string;
    route: MedicationRoute;
    startDate: string;
    status: 'Active';
    prescribedBy: string;
    instructions: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const MedicationFormModal: React.FC<MedicationFormModalProps> = ({
  patient,
  clinicianName,
  onSave,
  onClose,
}) => {
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [route, setRoute] = useState<MedicationRoute>('Oral');
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim() || !dosage.trim()) return;
    setSaving(true);
    try {
      await onSave({
        patientId: patient.id,
        drugName: drugName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        route,
        startDate,
        status: 'Active',
        prescribedBy: clinicianName,
        instructions: instructions.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Prescribe Medication"
      subtitle={`${patient.firstName} ${patient.lastName} · ${
        patient.allergies.length > 0 ? `Allergies: ${patient.allergies.join(', ')}` : 'No Known Drug Allergies'
      }`}
      onClose={onClose}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Medication Name *</label>
            <input
              type="text"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              placeholder="e.g. Atorvastatin"
              maxLength={FIELD_LIMITS.drugName}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Dosage *</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 20 mg"
              maxLength={FIELD_LIMITS.dosage}
              required
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Route</label>
            <select value={route} onChange={(e) => setRoute(e.target.value as MedicationRoute)} className={inputCls}>
              <option value="Oral">Oral</option>
              <option value="IV">IV</option>
              <option value="IM">IM</option>
              <option value="Subcutaneous">Subcutaneous</option>
              <option value="Topical">Topical</option>
              <option value="Inhaled">Inhaled</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Frequency *</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              maxLength={FIELD_LIMITS.frequency}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Administration Instructions</label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            maxLength={FIELD_LIMITS.instructions}
            placeholder="Special timing, food interactions, or monitoring instructions..."
            className={inputCls}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Prescribing...' : 'Issue Prescription'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 5. Order Lab Modal
interface LabOrderModalProps {
  patient: Patient;
  clinicianName: string;
  onSave: (data: Omit<LabOrder, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const LabOrderModal: React.FC<LabOrderModalProps> = ({
  patient,
  clinicianName,
  onSave,
  onClose,
}) => {
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState<LabCategory>('Metabolic');
  const [priority, setPriority] = useState<LabPriority>('Routine');
  const [referenceRange, setReferenceRange] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        testName: testName.trim(),
        category,
        priority,
        status: 'Ordered',
        orderedAt: nowLocalDateTimeInput(),
        resultValue: '',
        referenceRange: referenceRange.trim(),
        flag: 'Pending',
        orderedBy: clinicianName,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Order Diagnostic Study / Lab"
      subtitle={`${patient.firstName} ${patient.lastName} · ${patient.mrn}`}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Test or Study Name *</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. Comprehensive Metabolic Panel (CMP)"
            maxLength={FIELD_LIMITS.testName}
            required
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as LabCategory)} className={inputCls}>
              <option value="Hematology">Hematology</option>
              <option value="Metabolic">Metabolic</option>
              <option value="Lipid Panel">Lipid Panel</option>
              <option value="Endocrine">Endocrine</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Imaging">Imaging</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as LabPriority)} className={inputCls}>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Reference Range (Optional)</label>
          <input
            type="text"
            value={referenceRange}
            onChange={(e) => setReferenceRange(e.target.value)}
            placeholder="e.g. 0.7 - 1.3 mg/dL"
            maxLength={FIELD_LIMITS.referenceRange}
            className={inputCls}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Submitting...' : 'Submit Lab Order'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 6. Enter Lab Result Modal
interface LabResultModalProps {
  order: LabOrder;
  onSave: (
    labId: string,
    payload: { resultValue: string; referenceRange: string; flag: LabFlag }
  ) => Promise<void>;
  onClose: () => void;
}

export const LabResultModal: React.FC<LabResultModalProps> = ({ order, onSave, onClose }) => {
  const [resultValue, setResultValue] = useState(order.resultValue || '');
  const [referenceRange, setReferenceRange] = useState(order.referenceRange || '');
  const [flag, setFlag] = useState<LabFlag>(order.flag === 'Pending' ? 'Normal' : order.flag);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultValue.trim()) return;
    setSaving(true);
    try {
      await onSave(order.id, {
        resultValue: resultValue.trim(),
        referenceRange: referenceRange.trim(),
        flag,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Enter Diagnostic Result — ${order.testName}`}
      subtitle={`${order.patientName} · ${order.category} (${order.priority})`}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Observed Result Value *</label>
          <input
            type="text"
            value={resultValue}
            onChange={(e) => setResultValue(e.target.value)}
            placeholder="e.g. K+ 4.2 mEq/L, Cr 1.0 mg/dL"
            maxLength={FIELD_LIMITS.resultValue}
            required
            className={`${inputCls} font-mono`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Reference Range</label>
            <input
              type="text"
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              maxLength={FIELD_LIMITS.referenceRange}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Clinical Flag</label>
            <select value={flag} onChange={(e) => setFlag(e.target.value as LabFlag)} className={inputCls}>
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Submitting a result marks this order as Resulted and locks the diagnostic entry.
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Recording...' : 'Record Result'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 7. Clinician Profile Modal
interface ClinicianProfileModalProps {
  clinician: Clinician;
  onSave: (updates: Pick<Clinician, 'displayName' | 'specialty' | 'facility' | 'licenseNumber'>) => Promise<void>;
  onClose: () => void;
}

export const ClinicianProfileModal: React.FC<ClinicianProfileModalProps> = ({
  clinician,
  onSave,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(clinician.displayName);
  const [specialty, setSpecialty] = useState(clinician.specialty);
  const [facility, setFacility] = useState(clinician.facility);
  const [licenseNumber, setLicenseNumber] = useState(clinician.licenseNumber);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ displayName, specialty, facility, licenseNumber });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Clinician Workspace Credentials"
      subtitle={clinician.email}
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Clinician Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={FIELD_LIMITS.displayName}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Clinical Specialty</label>
          <input
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            maxLength={FIELD_LIMITS.specialty}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Primary Facility</label>
          <input
            type="text"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            maxLength={FIELD_LIMITS.facility}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Medical License / NPI</label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            maxLength={FIELD_LIMITS.licenseNumber}
            className={`${inputCls} font-mono`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Updating...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 8. Confirmation Dialog (replaces window.confirm)
interface ConfirmDialogModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={title} onClose={onClose} maxWidthClass="max-w-md">
      <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-lg cursor-pointer"
        >
          {busy ? 'Removing...' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};
