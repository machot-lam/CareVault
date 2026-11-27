import { CareStatus, EncounterStatus, LabFlag, LabPriority, LabStatus, MedicationStatus } from '../types/clinical';

export function careStatusTextClass(status: CareStatus): string {
  switch (status) {
    case 'Critical':
      return 'text-red-700 font-semibold';
    case 'Inpatient':
      return 'text-amber-700 font-semibold';
    case 'Active':
      return 'text-emerald-700 font-medium';
    case 'Discharged':
      return 'text-slate-500 font-medium';
  }
}

export function encounterStatusTextClass(status: EncounterStatus): string {
  switch (status) {
    case 'In Progress':
      return 'text-teal-700 font-semibold';
    case 'Scheduled':
      return 'text-sky-700 font-medium';
    case 'Completed':
      return 'text-emerald-700 font-medium';
    case 'Cancelled':
      return 'text-slate-500 font-medium';
  }
}

export function medicationStatusTextClass(status: MedicationStatus): string {
  switch (status) {
    case 'Active':
      return 'text-emerald-700 font-medium';
    case 'On Hold':
      return 'text-amber-700 font-medium';
    case 'Completed':
      return 'text-slate-600 font-medium';
    case 'Discontinued':
      return 'text-red-700 font-medium';
  }
}

export function labFlagTextClass(flag: LabFlag): string {
  switch (flag) {
    case 'Critical':
      return 'text-red-700 font-semibold';
    case 'Abnormal':
      return 'text-amber-700 font-semibold';
    case 'Normal':
      return 'text-emerald-700 font-medium';
    case 'Pending':
      return 'text-slate-500 font-medium';
  }
}

export function labPriorityTextClass(priority: LabPriority): string {
  switch (priority) {
    case 'STAT':
      return 'text-red-700 font-semibold';
    case 'Urgent':
      return 'text-amber-700 font-medium';
    case 'Routine':
      return 'text-slate-600 font-normal';
  }
}

export function labStatusTextClass(status: LabStatus): string {
  switch (status) {
    case 'Resulted':
      return 'text-emerald-700 font-medium';
    case 'In Lab':
      return 'text-sky-700 font-medium';
    case 'Ordered':
      return 'text-slate-700 font-medium';
    case 'Cancelled':
      return 'text-slate-500 font-medium';
  }
}
