import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  CalendarClock,
  CheckCircle2,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  Clinician,
  Encounter,
  LabOrder,
  Medication,
  Patient,
  VitalReading,
} from './types/clinical';
import {
  createEncounter,
  createLabOrder,
  createPatient,
  deletePatientWithRecords,
  deleteVitalReading,
  ensureClinicianProfile,
  enterLabResult,
  prescribeMedication,
  recordVitalReading,
  seedSampleClinicalPanel,
  updateClinicianProfile,
  updateEncounter,
  updateLabOrderStatus,
  updateMedicationStatus,
  updatePatient,
} from './services/clinicalStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignInScreen } from './components/SignInScreen';
import { OverviewView } from './components/OverviewView';
import { PatientsRegistryView } from './components/PatientsRegistryView';
import { PatientChartView } from './components/PatientChartView';
import { EncountersQueueView } from './components/EncountersQueueView';
import { LabsQueueView } from './components/LabsQueueView';
import {
  ClinicianProfileModal,
  ConfirmDialogModal,
  EncounterFormModal,
  LabOrderModal,
  LabResultModal,
  MedicationFormModal,
  PatientFormModal,
  VitalFormModal,
} from './components/ClinicalModals';

type NavView = 'overview' | 'patients' | 'encounters' | 'labs';

function CareVaultWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeView, setActiveView] = useState<NavView>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Modal State
  const [patientModalMode, setPatientModalMode] = useState<{ open: boolean; editing: Patient | null }>({
    open: false,
    editing: null,
  });
  const [vitalModalPatient, setVitalModalPatient] = useState<Patient | null>(null);
  const [encounterModal, setEncounterModal] = useState<{
    open: boolean;
    patient: Patient | null;
    editing: Encounter | null;
  }>({ open: false, patient: null, editing: null });
  const [medicationModalPatient, setMedicationModalPatient] = useState<Patient | null>(null);
  const [labOrderModalPatient, setLabOrderModalPatient] = useState<Patient | null>(null);
  const [labResultModalOrder, setLabResultModalOrder] = useState<LabOrder | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteTargetPatient, setDeleteTargetPatient] = useState<Patient | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setClinician(null);
        setPatients([]);
        setEncounters([]);
        setVitals([]);
        setMedications([]);
        setLabOrders([]);
        setSelectedPatientId(null);
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners strictly after auth is ready & verified user exists
  useEffect(() => {
    if (!authReady || !user) return;
    setDataLoading(true);
    let cancelled = false;

    ensureClinicianProfile(user)
      .then((profile) => {
        if (!cancelled) setClinician(profile);
      })
      .catch((err) => {
        console.error(err);
      });

    const uid = user.uid;

    const unsubClinician = onSnapshot(
      doc(db, 'clinicians', uid),
      (snap) => {
        if (snap.exists()) {
          setClinician(snap.data() as Clinician);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `clinicians/${uid}`)
    );

    const unsubPatients = onSnapshot(
      query(collection(db, 'patients'), where('ownerId', '==', uid)),
      (snap) => {
        setPatients(snap.docs.map((d) => d.data() as Patient));
        setDataLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'patients')
    );

    const unsubEncounters = onSnapshot(
      query(collection(db, 'encounters'), where('ownerId', '==', uid)),
      (snap) => {
        setEncounters(snap.docs.map((d) => d.data() as Encounter));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'encounters')
    );

    const unsubVitals = onSnapshot(
      query(collection(db, 'vitals'), where('ownerId', '==', uid)),
      (snap) => {
        setVitals(snap.docs.map((d) => d.data() as VitalReading));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'vitals')
    );

    const unsubMedications = onSnapshot(
      query(collection(db, 'medications'), where('ownerId', '==', uid)),
      (snap) => {
        setMedications(snap.docs.map((d) => d.data() as Medication));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'medications')
    );

    const unsubLabs = onSnapshot(
      query(collection(db, 'labOrders'), where('ownerId', '==', uid)),
      (snap) => {
        setLabOrders(snap.docs.map((d) => d.data() as LabOrder));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'labOrders')
    );

    return () => {
      cancelled = true;
      unsubClinician();
      unsubPatients();
      unsubEncounters();
      unsubVitals();
      unsubMedications();
      unsubLabs();
    };
  }, [authReady, user]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient) {
      return { encounters: [], vitals: [], medications: [], labOrders: [] };
    }
    return {
      encounters: encounters.filter((e) => e.patientId === selectedPatient.id),
      vitals: vitals.filter((v) => v.patientId === selectedPatient.id),
      medications: medications.filter((m) => m.patientId === selectedPatient.id),
      labOrders: labOrders.filter((l) => l.patientId === selectedPatient.id),
    };
  }, [selectedPatient, encounters, vitals, medications, labOrders]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">Initializing CareVault workspace...</div>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  const clinicianDisplayName = clinician?.displayName || user.displayName || 'Attending Clinician';

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setMobileMenuOpen(false);
  };

  const handleNavigate = (view: NavView) => {
    setActiveView(view);
    setSelectedPatientId(null);
    setMobileMenuOpen(false);
  };

  const handleLoadSamplePanel = async () => {
    setSeeding(true);
    try {
      await seedSampleClinicalPanel(user.uid, clinicianDisplayName);
      showToast('Sample 5-patient clinical panel loaded into CareVault.');
    } finally {
      setSeeding(false);
    }
  };

  const navItems: { id: NavView; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users, count: patients.length },
    {
      id: 'encounters',
      label: 'Schedule & Notes',
      icon: CalendarClock,
      count: encounters.filter((e) => e.status === 'Scheduled' || e.status === 'In Progress').length,
    },
    {
      id: 'labs',
      label: 'Diagnostics & Labs',
      icon: FlaskConical,
      count: labOrders.filter((l) => l.status === 'Ordered' || l.status === 'In Lab').length,
    },
  ];

  const breadcrumbText = selectedPatient
    ? `${selectedPatient.firstName} ${selectedPatient.lastName} · ${selectedPatient.mrn}`
    : navItems.find((n) => n.id === activeView)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation (256px) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-150 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Zone */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleNavigate('overview')}
              className="text-lg font-semibold tracking-tight text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              CareVault
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="p-3 space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = !selectedPatient && activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-teal-700/10 text-teal-900 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3 whitespace-nowrap">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                    {item.label}
                  </span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="text-xs font-mono text-slate-500 tabular-nums">{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Clinician Account Area */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            {!avatarFailed ? (
              <img
                src={user.photoURL || '/src/assets/images/clinician_avatar_portrait_1795789640406.jpg'}
                alt={clinicianDisplayName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-teal-700/10 text-teal-800 flex items-center justify-center text-xs font-semibold shrink-0">
                {clinicianDisplayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">{clinicianDisplayName}</div>
              <div className="text-xs text-slate-500 truncate">
                {clinician?.specialty || 'Internal Medicine'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5" />
              Credentials
            </button>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                {clinician?.facility || 'CareVault Medical Center'}
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-semibold text-slate-900 truncate">{breadcrumbText}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden md:block w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (selectedPatient && e.target.value.trim().length > 0) {
                    setSelectedPatientId(null);
                    setActiveView('patients');
                  }
                }}
                placeholder="Search MRN or patient..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-700"
              />
            </div>

            <button
              type="button"
              onClick={() => setPatientModalMode({ open: true, editing: null })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New Patient
            </button>
          </div>
        </header>

        {/* Workspace Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {toastMessage && (
            <div className="mb-5 px-4 py-2.5 bg-white border border-teal-200 rounded-lg flex items-center justify-between gap-3 text-xs text-teal-900">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                {toastMessage}
              </span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {selectedPatient ? (
            <PatientChartView
              patient={selectedPatient}
              encounters={selectedPatientRecords.encounters}
              vitals={selectedPatientRecords.vitals}
              medications={selectedPatientRecords.medications}
              labOrders={selectedPatientRecords.labOrders}
              onBack={() => setSelectedPatientId(null)}
              onEditPatient={(p) => setPatientModalMode({ open: true, editing: p })}
              onDeletePatient={(p) => setDeleteTargetPatient(p)}
              onRecordVitals={() => setVitalModalPatient(selectedPatient)}
              onDeleteVital={async (vitalId) => {
                await deleteVitalReading(vitalId);
                showToast('Vital reading removed.');
              }}
              onNewEncounter={() =>
                setEncounterModal({ open: true, patient: selectedPatient, editing: null })
              }
              onEditEncounter={(enc) =>
                setEncounterModal({ open: true, patient: selectedPatient, editing: enc })
              }
              onPrescribeMedication={() => setMedicationModalPatient(selectedPatient)}
              onUpdateMedicationStatus={async (medId, status) => {
                await updateMedicationStatus(medId, status);
                showToast(`Medication marked ${status}.`);
              }}
              onOrderLab={() => setLabOrderModalPatient(selectedPatient)}
              onAdvanceLabInLab={async (labId) => {
                await updateLabOrderStatus(labId, 'In Lab');
                showToast('Diagnostic order updated to In Lab.');
              }}
              onEnterLabResult={(order) => setLabResultModalOrder(order)}
              onCancelLabOrder={async (labId) => {
                await updateLabOrderStatus(labId, 'Cancelled');
                showToast('Diagnostic order cancelled.');
              }}
            />
          ) : activeView === 'overview' ? (
            <OverviewView
              patients={patients}
              encounters={encounters}
              vitals={vitals}
              labOrders={labOrders}
              loading={dataLoading}
              seeding={seeding}
              onSelectPatient={handleSelectPatient}
              onOpenNewPatient={() => setPatientModalMode({ open: true, editing: null })}
              onLoadSamplePanel={handleLoadSamplePanel}
              onNavigateView={(view) => handleNavigate(view)}
            />
          ) : activeView === 'patients' ? (
            <PatientsRegistryView
              patients={patients}
              globalSearch={globalSearch}
              onSelectPatient={handleSelectPatient}
              onOpenNewPatient={() => setPatientModalMode({ open: true, editing: null })}
            />
          ) : activeView === 'encounters' ? (
            <EncountersQueueView
              encounters={encounters}
              globalSearch={globalSearch}
              onSelectPatient={handleSelectPatient}
              onEditEncounter={(enc) => {
                const pat = patients.find((p) => p.id === enc.patientId) || null;
                if (pat) {
                  setEncounterModal({ open: true, patient: pat, editing: enc });
                }
              }}
            />
          ) : (
            <LabsQueueView
              labOrders={labOrders}
              globalSearch={globalSearch}
              onSelectPatient={handleSelectPatient}
              onAdvanceInLab={async (labId) => {
                await updateLabOrderStatus(labId, 'In Lab');
                showToast('Diagnostic order moved to In Lab.');
              }}
              onEnterResult={(order) => setLabResultModalOrder(order)}
            />
          )}
        </main>
      </div>

      {/* Clinical Modals */}
      {patientModalMode.open && (
        <PatientFormModal
          initialPatient={patientModalMode.editing}
          defaultClinicianName={clinicianDisplayName}
          onClose={() => setPatientModalMode({ open: false, editing: null })}
          onSave={async (data) => {
            if (patientModalMode.editing) {
              const { mrn: _ignored, ...updates } = data;
              await updatePatient(patientModalMode.editing.id, updates);
              showToast(`Updated patient record for ${data.firstName} ${data.lastName}.`);
            } else {
              const newId = await createPatient(user.uid, data);
              setSelectedPatientId(newId);
              showToast(`Registered ${data.firstName} ${data.lastName} (${data.mrn}).`);
            }
          }}
        />
      )}

      {vitalModalPatient && (
        <VitalFormModal
          patient={vitalModalPatient}
          clinicianName={clinicianDisplayName}
          onClose={() => setVitalModalPatient(null)}
          onSave={async (data) => {
            await recordVitalReading(user.uid, data);
            showToast(`Vitals recorded for ${vitalModalPatient.firstName} ${vitalModalPatient.lastName}.`);
          }}
        />
      )}

      {encounterModal.open && encounterModal.patient && (
        <EncounterFormModal
          patient={encounterModal.patient}
          initialEncounter={encounterModal.editing}
          clinicianName={clinicianDisplayName}
          onClose={() => setEncounterModal({ open: false, patient: null, editing: null })}
          onCreate={async (data) => {
            await createEncounter(user.uid, data);
            showToast(`Encounter created for ${data.patientName}.`);
          }}
          onUpdate={async (encounterId, updates) => {
            await updateEncounter(encounterId, updates);
            showToast(
              updates.status === 'Completed'
                ? 'Encounter signed and locked.'
                : 'SOAP note updated.'
            );
          }}
        />
      )}

      {medicationModalPatient && (
        <MedicationFormModal
          patient={medicationModalPatient}
          clinicianName={clinicianDisplayName}
          onClose={() => setMedicationModalPatient(null)}
          onSave={async (data) => {
            await prescribeMedication(user.uid, data);
            showToast(`Prescribed ${data.drugName} ${data.dosage}.`);
          }}
        />
      )}

      {labOrderModalPatient && (
        <LabOrderModal
          patient={labOrderModalPatient}
          clinicianName={clinicianDisplayName}
          onClose={() => setLabOrderModalPatient(null)}
          onSave={async (data) => {
            await createLabOrder(user.uid, data);
            showToast(`Submitted ${data.priority} lab order: ${data.testName}.`);
          }}
        />
      )}

      {labResultModalOrder && (
        <LabResultModal
          order={labResultModalOrder}
          onClose={() => setLabResultModalOrder(null)}
          onSave={async (labId, payload) => {
            await enterLabResult(labId, payload);
            showToast(`Result recorded for ${labResultModalOrder.testName}.`);
          }}
        />
      )}

      {profileModalOpen && clinician && (
        <ClinicianProfileModal
          clinician={clinician}
          onClose={() => setProfileModalOpen(false)}
          onSave={async (updates) => {
            await updateClinicianProfile(user.uid, updates);
            showToast('Clinician workspace credentials updated.');
          }}
        />
      )}

      {deleteTargetPatient && (
        <ConfirmDialogModal
          title={`Delete Patient Record — ${deleteTargetPatient.mrn}`}
          message={`Are you sure you want to permanently remove ${deleteTargetPatient.firstName} ${deleteTargetPatient.lastName} and all associated encounters, vitals, medications, and diagnostic lab records? This action cannot be undone.`}
          confirmLabel="Delete Patient Record"
          onClose={() => setDeleteTargetPatient(null)}
          onConfirm={async () => {
            await deletePatientWithRecords(user.uid, deleteTargetPatient.id);
            if (selectedPatientId === deleteTargetPatient.id) {
              setSelectedPatientId(null);
            }
            showToast(`Removed record for ${deleteTargetPatient.firstName} ${deleteTargetPatient.lastName}.`);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CareVaultWorkspace />
    </ErrorBoundary>
  );
}
