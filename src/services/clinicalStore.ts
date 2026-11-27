import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Clinician,
  DATE_PATTERN,
  Encounter,
  EncounterStatus,
  FIELD_LIMITS,
  LabOrder,
  LabStatus,
  Medication,
  MedicationStatus,
  MRN_PATTERN,
  Patient,
  VitalReading,
  clampString,
  generateClinicalId,
  generateMrn,
  todayIsoDate,
} from '../types/clinical';

function clampNumber(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function sanitizeAllergies(list: string[]): string[] {
  return list
    .map((item) => clampString(item, FIELD_LIMITS.allergyItemMaxLen))
    .filter((item) => item.length > 0)
    .slice(0, FIELD_LIMITS.allergiesMaxCount);
}

export async function ensureClinicianProfile(user: User): Promise<Clinician> {
  const path = `clinicians/${user.uid}`;
  try {
    const ref = doc(db, 'clinicians', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as Clinician;
    }
    const profile: Clinician = {
      uid: user.uid,
      displayName: clampString(user.displayName || 'Attending Clinician', FIELD_LIMITS.displayName) || 'Attending Clinician',
      email: clampString(user.email || 'clinician@carevault.local', FIELD_LIMITS.email),
      specialty: 'Internal Medicine',
      facility: 'CareVault Medical Center',
      licenseNumber: 'MD-409281',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateClinicianProfile(
  uid: string,
  updates: Pick<Clinician, 'displayName' | 'specialty' | 'facility' | 'licenseNumber'>
): Promise<void> {
  const path = `clinicians/${uid}`;
  try {
    await updateDoc(doc(db, 'clinicians', uid), {
      displayName: clampString(updates.displayName, FIELD_LIMITS.displayName) || 'Attending Clinician',
      specialty: clampString(updates.specialty, FIELD_LIMITS.specialty) || 'Internal Medicine',
      facility: clampString(updates.facility, FIELD_LIMITS.facility) || 'CareVault Medical Center',
      licenseNumber: clampString(updates.licenseNumber, FIELD_LIMITS.licenseNumber),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export type PatientInput = Omit<Patient, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export async function createPatient(ownerId: string, input: PatientInput): Promise<string> {
  const id = generateClinicalId('pat');
  const path = `patients/${id}`;
  const rawMrn = input.mrn.trim().toUpperCase();
  const safeMrn = MRN_PATTERN.test(rawMrn) && rawMrn.length >= 3
    ? rawMrn.slice(0, FIELD_LIMITS.mrn)
    : generateMrn();
  const safeDob = DATE_PATTERN.test(input.dateOfBirth) ? input.dateOfBirth : '1980-01-01';

  try {
    await setDoc(doc(db, 'patients', id), {
      id,
      ownerId,
      mrn: safeMrn,
      firstName: clampString(input.firstName, FIELD_LIMITS.firstName) || 'Unknown',
      lastName: clampString(input.lastName, FIELD_LIMITS.lastName) || 'Patient',
      dateOfBirth: safeDob,
      sex: input.sex,
      bloodType: input.bloodType,
      phone: clampString(input.phone, FIELD_LIMITS.phone) || 'Not provided',
      email: clampString(input.email, FIELD_LIMITS.email),
      address: clampString(input.address, FIELD_LIMITS.address),
      emergencyContactName: clampString(input.emergencyContactName, FIELD_LIMITS.emergencyContactName),
      emergencyContactPhone: clampString(input.emergencyContactPhone, FIELD_LIMITS.emergencyContactPhone),
      insuranceProvider: clampString(input.insuranceProvider, FIELD_LIMITS.insuranceProvider),
      insuranceMemberId: clampString(input.insuranceMemberId, FIELD_LIMITS.insuranceMemberId),
      primaryDiagnosis: clampString(input.primaryDiagnosis, FIELD_LIMITS.primaryDiagnosis),
      wardOrClinic: clampString(input.wardOrClinic, FIELD_LIMITS.wardOrClinic),
      attendingPhysician: clampString(input.attendingPhysician, FIELD_LIMITS.attendingPhysician),
      careStatus: input.careStatus,
      allergies: sanitizeAllergies(input.allergies),
      notesSummary: clampString(input.notesSummary, FIELD_LIMITS.notesSummary),
      lastVisitDate: clampString(input.lastVisitDate || todayIsoDate(), FIELD_LIMITS.lastVisitDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePatient(
  patientId: string,
  input: Omit<PatientInput, 'mrn'>
): Promise<void> {
  const path = `patients/${patientId}`;
  const safeDob = DATE_PATTERN.test(input.dateOfBirth) ? input.dateOfBirth : '1980-01-01';
  try {
    await updateDoc(doc(db, 'patients', patientId), {
      firstName: clampString(input.firstName, FIELD_LIMITS.firstName) || 'Unknown',
      lastName: clampString(input.lastName, FIELD_LIMITS.lastName) || 'Patient',
      dateOfBirth: safeDob,
      sex: input.sex,
      bloodType: input.bloodType,
      phone: clampString(input.phone, FIELD_LIMITS.phone) || 'Not provided',
      email: clampString(input.email, FIELD_LIMITS.email),
      address: clampString(input.address, FIELD_LIMITS.address),
      emergencyContactName: clampString(input.emergencyContactName, FIELD_LIMITS.emergencyContactName),
      emergencyContactPhone: clampString(input.emergencyContactPhone, FIELD_LIMITS.emergencyContactPhone),
      insuranceProvider: clampString(input.insuranceProvider, FIELD_LIMITS.insuranceProvider),
      insuranceMemberId: clampString(input.insuranceMemberId, FIELD_LIMITS.insuranceMemberId),
      primaryDiagnosis: clampString(input.primaryDiagnosis, FIELD_LIMITS.primaryDiagnosis),
      wardOrClinic: clampString(input.wardOrClinic, FIELD_LIMITS.wardOrClinic),
      attendingPhysician: clampString(input.attendingPhysician, FIELD_LIMITS.attendingPhysician),
      careStatus: input.careStatus,
      allergies: sanitizeAllergies(input.allergies),
      notesSummary: clampString(input.notesSummary, FIELD_LIMITS.notesSummary),
      lastVisitDate: clampString(input.lastVisitDate || todayIsoDate(), FIELD_LIMITS.lastVisitDate),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePatientWithRecords(ownerId: string, patientId: string): Promise<void> {
  const path = `patients/${patientId}`;
  try {
    const childCollections = ['encounters', 'vitals', 'medications', 'labOrders'] as const;
    const batch = writeBatch(db);

    for (const colName of childCollections) {
      const q = query(
        collection(db, colName),
        where('ownerId', '==', ownerId),
        where('patientId', '==', patientId)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => batch.delete(d.ref));
    }

    batch.delete(doc(db, 'patients', patientId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export type EncounterInput = Omit<Encounter, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export async function createEncounter(ownerId: string, input: EncounterInput): Promise<string> {
  const id = generateClinicalId('enc');
  const path = `encounters/${id}`;
  try {
    await setDoc(doc(db, 'encounters', id), {
      id,
      ownerId,
      patientId: input.patientId,
      patientName: clampString(input.patientName, FIELD_LIMITS.firstName + FIELD_LIMITS.lastName),
      patientMrn: clampString(input.patientMrn.toUpperCase(), FIELD_LIMITS.mrn),
      encounterType: input.encounterType,
      status: input.status,
      scheduledAt: clampString(input.scheduledAt, 32) || todayIsoDate(),
      chiefComplaint: clampString(input.chiefComplaint, FIELD_LIMITS.chiefComplaint) || 'Clinical follow-up',
      subjectiveNote: clampString(input.subjectiveNote, FIELD_LIMITS.soapNote),
      objectiveNote: clampString(input.objectiveNote, FIELD_LIMITS.soapNote),
      assessmentNote: clampString(input.assessmentNote, FIELD_LIMITS.soapNote),
      planNote: clampString(input.planNote, FIELD_LIMITS.soapNote),
      clinicianName: clampString(input.clinicianName, FIELD_LIMITS.attendingPhysician) || 'Attending Clinician',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEncounter(
  encounterId: string,
  updates: {
    status: EncounterStatus;
    subjectiveNote: string;
    objectiveNote: string;
    assessmentNote: string;
    planNote: string;
  }
): Promise<void> {
  const path = `encounters/${encounterId}`;
  try {
    await updateDoc(doc(db, 'encounters', encounterId), {
      status: updates.status,
      subjectiveNote: clampString(updates.subjectiveNote, FIELD_LIMITS.soapNote),
      objectiveNote: clampString(updates.objectiveNote, FIELD_LIMITS.soapNote),
      assessmentNote: clampString(updates.assessmentNote, FIELD_LIMITS.soapNote),
      planNote: clampString(updates.planNote, FIELD_LIMITS.soapNote),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export type VitalInput = Omit<VitalReading, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export async function recordVitalReading(ownerId: string, input: VitalInput): Promise<string> {
  const id = generateClinicalId('vit');
  const path = `vitals/${id}`;
  try {
    await setDoc(doc(db, 'vitals', id), {
      id,
      ownerId,
      patientId: input.patientId,
      recordedAt: clampString(input.recordedAt, 32) || new Date().toISOString().slice(0, 16),
      systolicBp: clampNumber(Number(input.systolicBp), 40, 280),
      diastolicBp: clampNumber(Number(input.diastolicBp), 20, 180),
      heartRate: clampNumber(Number(input.heartRate), 20, 240),
      respiratoryRate: clampNumber(Number(input.respiratoryRate), 4, 60),
      temperatureC: Number(clampNumber(Number(input.temperatureC), 30, 44).toFixed(1)),
      spo2: clampNumber(Number(input.spo2), 50, 100),
      weightKg: Number(clampNumber(Number(input.weightKg), 1, 400).toFixed(1)),
      recordedBy: clampString(input.recordedBy, FIELD_LIMITS.attendingPhysician) || 'Clinician',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteVitalReading(vitalId: string): Promise<void> {
  const path = `vitals/${vitalId}`;
  try {
    await deleteDoc(doc(db, 'vitals', vitalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export type MedicationInput = Omit<Medication, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export async function prescribeMedication(ownerId: string, input: MedicationInput): Promise<string> {
  const id = generateClinicalId('med');
  const path = `medications/${id}`;
  const safeStartDate = DATE_PATTERN.test(input.startDate) ? input.startDate : todayIsoDate();
  try {
    await setDoc(doc(db, 'medications', id), {
      id,
      ownerId,
      patientId: input.patientId,
      drugName: clampString(input.drugName, FIELD_LIMITS.drugName) || 'Medication',
      dosage: clampString(input.dosage, FIELD_LIMITS.dosage) || '10 mg',
      frequency: clampString(input.frequency, FIELD_LIMITS.frequency) || 'Once daily',
      route: input.route,
      startDate: safeStartDate,
      status: input.status,
      prescribedBy: clampString(input.prescribedBy, FIELD_LIMITS.attendingPhysician) || 'Attending Clinician',
      instructions: clampString(input.instructions, FIELD_LIMITS.instructions),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMedicationStatus(
  medicationId: string,
  status: MedicationStatus
): Promise<void> {
  const path = `medications/${medicationId}`;
  try {
    await updateDoc(doc(db, 'medications', medicationId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export type LabOrderInput = Omit<LabOrder, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export async function createLabOrder(ownerId: string, input: LabOrderInput): Promise<string> {
  const id = generateClinicalId('lab');
  const path = `labOrders/${id}`;
  try {
    await setDoc(doc(db, 'labOrders', id), {
      id,
      ownerId,
      patientId: input.patientId,
      patientName: clampString(input.patientName, 160),
      testName: clampString(input.testName, FIELD_LIMITS.testName) || 'Diagnostic Panel',
      category: input.category,
      priority: input.priority,
      status: input.status,
      orderedAt: clampString(input.orderedAt, 32) || new Date().toISOString().slice(0, 16),
      resultValue: clampString(input.resultValue, FIELD_LIMITS.resultValue),
      referenceRange: clampString(input.referenceRange, FIELD_LIMITS.referenceRange),
      flag: input.flag,
      orderedBy: clampString(input.orderedBy, FIELD_LIMITS.attendingPhysician) || 'Attending Clinician',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLabOrderStatus(labId: string, status: LabStatus): Promise<void> {
  const path = `labOrders/${labId}`;
  try {
    await updateDoc(doc(db, 'labOrders', labId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function enterLabResult(
  labId: string,
  payload: {
    resultValue: string;
    referenceRange: string;
    flag: LabOrder['flag'];
  }
): Promise<void> {
  const path = `labOrders/${labId}`;
  try {
    await updateDoc(doc(db, 'labOrders', labId), {
      status: 'Resulted',
      resultValue: clampString(payload.resultValue, FIELD_LIMITS.resultValue),
      referenceRange: clampString(payload.referenceRange, FIELD_LIMITS.referenceRange),
      flag: payload.flag,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedSampleClinicalPanel(
  ownerId: string,
  clinicianName: string
): Promise<void> {
  const safeClinician = clampString(clinicianName || 'Dr. Elena Vance', FIELD_LIMITS.attendingPhysician);
  const patientSeeds: Omit<Patient, 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
    {
      id: generateClinicalId('pat'),
      mrn: 'MRN-408219',
      firstName: 'Clara',
      lastName: 'Lindqvist',
      dateOfBirth: '1978-06-18',
      sex: 'Female',
      bloodType: 'O+',
      phone: '(415) 555-0184',
      email: 'clara.lindqvist@example.org',
      address: '420 Cedarcrest Ave, San Francisco, CA',
      emergencyContactName: 'Henrik Lindqvist (Spouse)',
      emergencyContactPhone: '(415) 555-0191',
      insuranceProvider: 'BlueCross Clinical PPO',
      insuranceMemberId: 'BC-9928410',
      primaryDiagnosis: 'Stage 2 Essential Hypertension & Type 2 Diabetes Mellitus',
      wardOrClinic: 'Cardiometabolic Clinic',
      attendingPhysician: safeClinician,
      careStatus: 'Active',
      allergies: ['Penicillin', 'Sulfonamides'],
      notesSummary: 'Responding well to combination ACE-inhibitor and GLP-1 therapy. Monitoring home BP log and quarterly HbA1c.',
      lastVisitDate: '2026-11-24',
    },
    {
      id: generateClinicalId('pat'),
      mrn: 'MRN-519044',
      firstName: 'Marcus',
      lastName: 'Okafor',
      dateOfBirth: '1962-11-03',
      sex: 'Male',
      bloodType: 'A-',
      phone: '(415) 555-0147',
      email: 'm.okafor@example.org',
      address: '890 Sutter St, Apt 6B, San Francisco, CA',
      emergencyContactName: 'Nadia Okafor (Daughter)',
      emergencyContactPhone: '(415) 555-0162',
      insuranceProvider: 'Medicare Part B',
      insuranceMemberId: 'MC-7740192A',
      primaryDiagnosis: 'Acute Decompensated Heart Failure (HFrEF, EF 35%)',
      wardOrClinic: 'Telemetry Unit 4B',
      attendingPhysician: safeClinician,
      careStatus: 'Critical',
      allergies: ['Iodinated Contrast Dye'],
      notesSummary: 'Admitted for IV diuresis following 3.5 kg fluid weight gain and worsening orthopnea. Strict I/O and daily BMP monitoring.',
      lastVisitDate: '2026-11-27',
    },
    {
      id: generateClinicalId('pat'),
      mrn: 'MRN-603782',
      firstName: 'Sora',
      lastName: 'Takahashi',
      dateOfBirth: '1991-02-22',
      sex: 'Female',
      bloodType: 'B+',
      phone: '(415) 555-0129',
      email: 'sora.takahashi@example.org',
      address: '1540 Chestnut St, San Francisco, CA',
      emergencyContactName: 'Kenji Takahashi (Brother)',
      emergencyContactPhone: '(415) 555-0133',
      insuranceProvider: 'Aetna Premier Health',
      insuranceMemberId: 'AE-3049188',
      primaryDiagnosis: 'Moderate Persistent Asthma — Post-Viral Exacerbation',
      wardOrClinic: 'Pulmonary Outpatient',
      attendingPhysician: safeClinician,
      careStatus: 'Active',
      allergies: ['Aspirin / NSAIDs'],
      notesSummary: 'Step-up ICS/LABA regimen initiated. Peak expiratory flow improving; reviewing inhaler spacer technique.',
      lastVisitDate: '2026-11-22',
    },
    {
      id: generateClinicalId('pat'),
      mrn: 'MRN-712950',
      firstName: 'David',
      lastName: 'Kowalski',
      dateOfBirth: '1954-09-12',
      sex: 'Male',
      bloodType: 'AB+',
      phone: '(415) 555-0176',
      email: 'dkowalski@example.org',
      address: '215 Vicente St, San Francisco, CA',
      emergencyContactName: 'Marta Kowalski (Spouse)',
      emergencyContactPhone: '(415) 555-0177',
      insuranceProvider: 'UnitedHealthcare Choice',
      insuranceMemberId: 'UH-6182045',
      primaryDiagnosis: 'Community-Acquired Pneumonia — Resolving on Ward',
      wardOrClinic: 'Medical Ward 3A',
      attendingPhysician: safeClinician,
      careStatus: 'Inpatient',
      allergies: [],
      notesSummary: 'Afebrile for 36 hours on oral step-down antibiotic coverage. Transitioning off supplemental 2L O2 nasal cannula.',
      lastVisitDate: '2026-11-26',
    },
    {
      id: generateClinicalId('pat'),
      mrn: 'MRN-824311',
      firstName: 'Amira',
      lastName: 'Hassan',
      dateOfBirth: '1986-04-09',
      sex: 'Female',
      bloodType: 'O-',
      phone: '(415) 555-0198',
      email: 'amira.hassan@example.org',
      address: '612 Valencia St, San Francisco, CA',
      emergencyContactName: 'Tariq Hassan (Father)',
      emergencyContactPhone: '(415) 555-0104',
      insuranceProvider: 'Cigna Open Access',
      insuranceMemberId: 'CG-5591023',
      primaryDiagnosis: 'Subclinical Hypothyroidism & Iron Deficiency Anemia',
      wardOrClinic: 'General Internal Medicine',
      attendingPhysician: safeClinician,
      careStatus: 'Discharged',
      allergies: ['Latex'],
      notesSummary: 'Ferritin and TSH normalized after 12 weeks of oral supplementation. Scheduled for 6-month routine follow-up.',
      lastVisitDate: '2026-11-15',
    },
  ];

  // Phase 1: Write patients first so relational parent exists() checks pass
  try {
    const patientBatch = writeBatch(db);
    for (const p of patientSeeds) {
      patientBatch.set(doc(db, 'patients', p.id), {
        ...p,
        ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await patientBatch.commit();

    // Phase 2: Write vitals series, encounters, medications, and lab orders
    const childBatch = writeBatch(db);

    const [clara, marcus, sora, david, amira] = patientSeeds;

    const vitalSeeds: Omit<VitalReading, 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
      // Clara (4 readings)
      { id: generateClinicalId('vit'), patientId: clara.id, recordedAt: '2026-09-10T09:15', systolicBp: 148, diastolicBp: 92, heartRate: 78, respiratoryRate: 16, temperatureC: 36.7, spo2: 98, weightKg: 74.2, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: clara.id, recordedAt: '2026-10-08T10:30', systolicBp: 140, diastolicBp: 88, heartRate: 74, respiratoryRate: 15, temperatureC: 36.6, spo2: 98, weightKg: 73.1, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: clara.id, recordedAt: '2026-11-05T09:45', systolicBp: 132, diastolicBp: 84, heartRate: 71, respiratoryRate: 16, temperatureC: 36.7, spo2: 99, weightKg: 72.0, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: clara.id, recordedAt: '2026-11-24T11:10', systolicBp: 126, diastolicBp: 80, heartRate: 68, respiratoryRate: 14, temperatureC: 36.6, spo2: 99, weightKg: 71.4, recordedBy: safeClinician },
      // Marcus (4 readings)
      { id: generateClinicalId('vit'), patientId: marcus.id, recordedAt: '2026-11-24T18:00', systolicBp: 158, diastolicBp: 96, heartRate: 104, respiratoryRate: 24, temperatureC: 36.8, spo2: 91, weightKg: 91.8, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: marcus.id, recordedAt: '2026-11-25T08:00', systolicBp: 144, diastolicBp: 88, heartRate: 96, respiratoryRate: 22, temperatureC: 36.7, spo2: 93, weightKg: 90.6, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: marcus.id, recordedAt: '2026-11-26T08:00', systolicBp: 134, diastolicBp: 82, heartRate: 88, respiratoryRate: 20, temperatureC: 36.7, spo2: 95, weightKg: 89.2, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: marcus.id, recordedAt: '2026-11-27T06:15', systolicBp: 124, diastolicBp: 78, heartRate: 82, respiratoryRate: 18, temperatureC: 36.6, spo2: 96, weightKg: 88.4, recordedBy: safeClinician },
      // Sora (3 readings)
      { id: generateClinicalId('vit'), patientId: sora.id, recordedAt: '2026-11-12T14:20', systolicBp: 118, diastolicBp: 74, heartRate: 92, respiratoryRate: 22, temperatureC: 37.1, spo2: 94, weightKg: 58.0, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: sora.id, recordedAt: '2026-11-18T11:00', systolicBp: 114, diastolicBp: 72, heartRate: 80, respiratoryRate: 18, temperatureC: 36.8, spo2: 97, weightKg: 58.1, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: sora.id, recordedAt: '2026-11-22T15:10', systolicBp: 112, diastolicBp: 70, heartRate: 74, respiratoryRate: 16, temperatureC: 36.6, spo2: 99, weightKg: 58.2, recordedBy: safeClinician },
      // David (3 readings)
      { id: generateClinicalId('vit'), patientId: david.id, recordedAt: '2026-11-24T07:30', systolicBp: 136, diastolicBp: 82, heartRate: 98, respiratoryRate: 22, temperatureC: 38.4, spo2: 92, weightKg: 82.0, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: david.id, recordedAt: '2026-11-25T07:30', systolicBp: 130, diastolicBp: 78, heartRate: 84, respiratoryRate: 19, temperatureC: 37.4, spo2: 95, weightKg: 81.8, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: david.id, recordedAt: '2026-11-26T07:30', systolicBp: 126, diastolicBp: 76, heartRate: 76, respiratoryRate: 16, temperatureC: 36.8, spo2: 97, weightKg: 81.7, recordedBy: safeClinician },
      // Amira (2 readings)
      { id: generateClinicalId('vit'), patientId: amira.id, recordedAt: '2026-09-14T10:00', systolicBp: 110, diastolicBp: 68, heartRate: 76, respiratoryRate: 15, temperatureC: 36.5, spo2: 99, weightKg: 62.5, recordedBy: safeClinician },
      { id: generateClinicalId('vit'), patientId: amira.id, recordedAt: '2026-11-15T10:15', systolicBp: 112, diastolicBp: 70, heartRate: 70, respiratoryRate: 14, temperatureC: 36.6, spo2: 99, weightKg: 62.8, recordedBy: safeClinician },
    ];

    for (const v of vitalSeeds) {
      childBatch.set(doc(db, 'vitals', v.id), {
        ...v,
        ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const encounterSeeds: Omit<Encounter, 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
      {
        id: generateClinicalId('enc'),
        patientId: marcus.id,
        patientName: `${marcus.firstName} ${marcus.lastName}`,
        patientMrn: marcus.mrn,
        encounterType: 'Inpatient Round',
        status: 'In Progress',
        scheduledAt: '2026-11-27T08:30',
        chiefComplaint: 'Morning telemetry round — dyspnea & diuresis response',
        subjectiveNote: 'Patient reports improved breathing overnight, sleeping on 2 pillows instead of 4. Mild ankle swelling persists.',
        objectiveNote: 'BP 124/78, HR 82, SpO2 96% on room air. Bibasilar crackles improved from yesterday. Trace 1+ pitting edema bilaterally. Net -1.8 L urine output over 24h.',
        assessmentNote: 'Acute decompensated HFrEF steadily compensating on IV furosemide; renal function stable.',
        planNote: 'Continue IV furosemide 40 mg BID today; check morning BMP and magnesium. Consider transition to oral torsemide tomorrow if euvolemic.',
        clinicianName: safeClinician,
      },
      {
        id: generateClinicalId('enc'),
        patientId: david.id,
        patientName: `${david.firstName} ${david.lastName}`,
        patientMrn: david.mrn,
        encounterType: 'Inpatient Round',
        status: 'Scheduled',
        scheduledAt: '2026-11-27T10:00',
        chiefComplaint: 'Ward follow-up for resolving pneumonia & oxygen weaning',
        subjectiveNote: 'Appetite returning, cough productive of minimal clear sputum, no pleuritic chest pain.',
        objectiveNote: 'Afebrile 36.8 C, SpO2 97% on room air trial.',
        assessmentNote: 'Resolving community-acquired pneumonia, clinically stable for discharge planning.',
        planNote: 'Complete 7-day oral antibiotic course, arrange outpatient chest radiograph in 6 weeks.',
        clinicianName: safeClinician,
      },
      {
        id: generateClinicalId('enc'),
        patientId: clara.id,
        patientName: `${clara.firstName} ${clara.lastName}`,
        patientMrn: clara.mrn,
        encounterType: 'Follow-Up',
        status: 'Completed',
        scheduledAt: '2026-11-24T11:00',
        chiefComplaint: 'Quarterly cardiometabolic and HbA1c review',
        subjectiveNote: 'Adherent to lisinopril and semaglutide without nausea or orthostatic dizziness. Walking 30 minutes daily.',
        objectiveNote: 'BP 126/80, HR 68, BMI 25.4. Cardiovascular exam regular rate and rhythm, no murmurs. Foot monofilament exam intact bilaterally.',
        assessmentNote: 'Hypertension at goal (<130/80). Type 2 diabetes improving on current regimen.',
        planNote: 'Continue Lisinopril 20 mg daily and Metformin XR 1000 mg daily. Repeat HbA1c and lipid panel prior to February visit.',
        clinicianName: safeClinician,
      },
      {
        id: generateClinicalId('enc'),
        patientId: sora.id,
        patientName: `${sora.firstName} ${sora.lastName}`,
        patientMrn: sora.mrn,
        encounterType: 'Telehealth',
        status: 'Scheduled',
        scheduledAt: '2026-11-27T14:30',
        chiefComplaint: 'Post-exacerbation asthma symptom check & peak flow review',
        subjectiveNote: '',
        objectiveNote: '',
        assessmentNote: '',
        planNote: '',
        clinicianName: safeClinician,
      },
    ];

    for (const e of encounterSeeds) {
      childBatch.set(doc(db, 'encounters', e.id), {
        ...e,
        ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const medicationSeeds: Omit<Medication, 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
      { id: generateClinicalId('med'), patientId: clara.id, drugName: 'Lisinopril', dosage: '20 mg', frequency: 'Once daily', route: 'Oral', startDate: '2025-04-12', status: 'Active', prescribedBy: safeClinician, instructions: 'Take in the morning with or without food.' },
      { id: generateClinicalId('med'), patientId: clara.id, drugName: 'Metformin XR', dosage: '1000 mg', frequency: 'Once daily with dinner', route: 'Oral', startDate: '2025-04-12', status: 'Active', prescribedBy: safeClinician, instructions: 'Swallow tablet whole with evening meal.' },
      { id: generateClinicalId('med'), patientId: marcus.id, drugName: 'Furosemide', dosage: '40 mg', frequency: 'Every 12 hours', route: 'IV', startDate: '2026-11-24', status: 'Active', prescribedBy: safeClinician, instructions: 'Monitor strict intake/output and serum potassium.' },
      { id: generateClinicalId('med'), patientId: marcus.id, drugName: 'Carvedilol', dosage: '12.5 mg', frequency: 'Twice daily', route: 'Oral', startDate: '2024-08-19', status: 'On Hold', prescribedBy: safeClinician, instructions: 'Hold during acute volume overload; resume prior to discharge.' },
      { id: generateClinicalId('med'), patientId: sora.id, drugName: 'Budesonide / Formoterol', dosage: '160/4.5 mcg', frequency: '2 puffs twice daily', route: 'Inhaled', startDate: '2026-11-12', status: 'Active', prescribedBy: safeClinician, instructions: 'Rinse mouth with water after inhalation.' },
      { id: generateClinicalId('med'), patientId: david.id, drugName: 'Amoxicillin / Clavulanate', dosage: '875/125 mg', frequency: 'Every 12 hours', route: 'Oral', startDate: '2026-11-25', status: 'Active', prescribedBy: safeClinician, instructions: 'Complete full 7-day inpatient/outpatient course.' },
      { id: generateClinicalId('med'), patientId: amira.id, drugName: 'Levothyroxine', dosage: '50 mcg', frequency: 'Once daily', route: 'Oral', startDate: '2026-06-01', status: 'Active', prescribedBy: safeClinician, instructions: 'Take on an empty stomach 30 minutes before breakfast.' },
    ];

    for (const m of medicationSeeds) {
      childBatch.set(doc(db, 'medications', m.id), {
        ...m,
        ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const labSeeds: Omit<LabOrder, 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
      { id: generateClinicalId('lab'), patientId: marcus.id, patientName: `${marcus.firstName} ${marcus.lastName}`, testName: 'NT-proBNP', category: 'Metabolic', priority: 'STAT', status: 'Resulted', orderedAt: '2026-11-27T05:30', resultValue: '3,420 pg/mL', referenceRange: '< 125 pg/mL', flag: 'Critical', orderedBy: safeClinician },
      { id: generateClinicalId('lab'), patientId: marcus.id, patientName: `${marcus.firstName} ${marcus.lastName}`, testName: 'Basic Metabolic Panel (BMP)', category: 'Metabolic', priority: 'Urgent', status: 'In Lab', orderedAt: '2026-11-27T06:00', resultValue: '', referenceRange: 'K+ 3.5-5.0 mEq/L, Cr 0.7-1.3 mg/dL', flag: 'Pending', orderedBy: safeClinician },
      { id: generateClinicalId('lab'), patientId: clara.id, patientName: `${clara.firstName} ${clara.lastName}`, testName: 'Hemoglobin A1c', category: 'Endocrine', priority: 'Routine', status: 'Resulted', orderedAt: '2026-11-23T08:45', resultValue: '6.9%', referenceRange: '< 7.0% target', flag: 'Normal', orderedBy: safeClinician },
      { id: generateClinicalId('lab'), patientId: david.id, patientName: `${david.firstName} ${david.lastName}`, testName: 'Complete Blood Count (CBC)', category: 'Hematology', priority: 'Routine', status: 'Resulted', orderedAt: '2026-11-26T06:30', resultValue: 'WBC 11.4 x10^9/L', referenceRange: '4.5-11.0 x10^9/L', flag: 'Abnormal', orderedBy: safeClinician },
      { id: generateClinicalId('lab'), patientId: sora.id, patientName: `${sora.firstName} ${sora.lastName}`, testName: 'Serum IgE & Eosinophil Count', category: 'Hematology', priority: 'Routine', status: 'Ordered', orderedAt: '2026-11-26T15:20', resultValue: '', referenceRange: '0-100 IU/mL', flag: 'Pending', orderedBy: safeClinician },
    ];

    for (const l of labSeeds) {
      childBatch.set(doc(db, 'labOrders', l.id), {
        ...l,
        ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await childBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'patients/sample_seed');
  }
}
