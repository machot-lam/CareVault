export type CareStatus = 'Active' | 'Inpatient' | 'Critical' | 'Discharged';
export type SexOption = 'Female' | 'Male' | 'Other';
export type BloodTypeOption = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export type EncounterType =
  | 'Outpatient Visit'
  | 'Follow-Up'
  | 'Inpatient Round'
  | 'Urgent Triage'
  | 'Telehealth';

export type EncounterStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export type MedicationRoute = 'Oral' | 'IV' | 'IM' | 'Subcutaneous' | 'Topical' | 'Inhaled';
export type MedicationStatus = 'Active' | 'On Hold' | 'Completed' | 'Discontinued';

export type LabCategory =
  | 'Hematology'
  | 'Metabolic'
  | 'Lipid Panel'
  | 'Endocrine'
  | 'Microbiology'
  | 'Imaging';
export type LabPriority = 'Routine' | 'Urgent' | 'STAT';
export type LabStatus = 'Ordered' | 'In Lab' | 'Resulted' | 'Cancelled';
export type LabFlag = 'Normal' | 'Abnormal' | 'Critical' | 'Pending';

export interface Clinician {
  uid: string;
  displayName: string;
  email: string;
  specialty: string;
  facility: string;
  licenseNumber: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Patient {
  id: string;
  ownerId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: SexOption;
  bloodType: BloodTypeOption;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insuranceMemberId: string;
  primaryDiagnosis: string;
  wardOrClinic: string;
  attendingPhysician: string;
  careStatus: CareStatus;
  allergies: string[];
  notesSummary: string;
  lastVisitDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Encounter {
  id: string;
  ownerId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  encounterType: EncounterType;
  status: EncounterStatus;
  scheduledAt: string;
  chiefComplaint: string;
  subjectiveNote: string;
  objectiveNote: string;
  assessmentNote: string;
  planNote: string;
  clinicianName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VitalReading {
  id: string;
  ownerId: string;
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
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Medication {
  id: string;
  ownerId: string;
  patientId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  route: MedicationRoute;
  startDate: string;
  status: MedicationStatus;
  prescribedBy: string;
  instructions: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LabOrder {
  id: string;
  ownerId: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: LabCategory;
  priority: LabPriority;
  status: LabStatus;
  orderedAt: string;
  resultValue: string;
  referenceRange: string;
  flag: LabFlag;
  orderedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Synchronized verbatim with firebase-blueprint.json & firestore.rules
export const FIELD_LIMITS = {
  id: 128,
  mrn: 24,
  firstName: 80,
  lastName: 80,
  phone: 32,
  email: 160,
  address: 240,
  emergencyContactName: 120,
  emergencyContactPhone: 32,
  insuranceProvider: 100,
  insuranceMemberId: 60,
  primaryDiagnosis: 160,
  wardOrClinic: 80,
  attendingPhysician: 120,
  notesSummary: 1000,
  lastVisitDate: 24,
  allergiesMaxCount: 15,
  allergyItemMaxLen: 80,
  chiefComplaint: 240,
  soapNote: 2000,
  drugName: 140,
  dosage: 60,
  frequency: 80,
  instructions: 400,
  testName: 140,
  resultValue: 160,
  referenceRange: 100,
  specialty: 80,
  facility: 120,
  licenseNumber: 40,
  displayName: 120,
} as const;

export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const MRN_PATTERN = /^[A-Z0-9-]+$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function generateClinicalId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function generateMrn(): string {
  const num = Math.floor(100000 + Math.random() * 899999);
  return `MRN-${num}`;
}

export function calculateAge(dob: string): number {
  if (!DATE_PATTERN.test(dob)) return 0;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function formatShortDate(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(isoOrDate.length === 10 ? `${isoOrDate}T00:00:00` : isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(isoOrDate.length === 10 ? `${isoOrDate}T09:00:00` : isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowLocalDateTimeInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
