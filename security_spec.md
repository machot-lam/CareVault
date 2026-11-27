# CareVault Security Specification (Payload-First Security TDD)

## 1. Data Invariants
1. **Clinician Isolation & PII Ownership**: A clinician profile (`clinicians/{clinicianId}`) and all patient records (`patients/{patientId}`) belong strictly to a verified authenticated user (`ownerId == request.auth.uid`). No blanket reads or cross-clinician list queries are permitted.
2. **Relational Parent Integrity**: Every clinical sub-record (`encounters`, `vitals`, `medications`, `labOrders`) MUST reference an existing `patientId` in `/patients/{patientId}` whose `ownerId` matches `request.auth.uid`. Orphaned writes are rejected.
3. **Immutable Identity & Temporal Integrity**: `id`, `ownerId`, `patientId`, `mrn`, and `createdAt` are immutable after creation. Both `createdAt` (create) and `updatedAt` (create/update) MUST equal `request.time`.
4. **Terminal State Locking**: Once an `Encounter` reaches `Completed` or `Cancelled`, a `Medication` reaches `Completed` or `Discontinued`, or a `LabOrder` reaches `Resulted` or `Cancelled`, no further non-admin mutations are permitted.
5. **Strict Volumetric & Schema Bounds**: Every string field has an explicit `maxLength`, every enum is allowlisted, `allergies` is bounded to `<= 15` entries with element type verification, and `affectedKeys().hasOnly(...)` prevents shadow fields.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unverified Email Spoofing**: Authenticated user with `email_verified: false` attempting to create `patients/pat-1`.
2. **Owner Spoofing on Create**: User `uid-A` creating `patients/pat-2` with `ownerId: "uid-B"`.
3. **Shadow / Ghost Field Injection**: Creating `patients/pat-3` with an extra undeclared field `isAdminApproved: true`.
4. **Orphaned Encounter Write**: Creating `encounters/enc-1` referencing a nonexistent `patientId: "nonexistent-pat"`.
5. **Cross-Tenant Parent Hijack**: User `uid-A` creating `vitals/vit-1` with `ownerId: "uid-A"` but `patientId` owned by `uid-B`.
6. **Path Variable Poisoning**: Writing to `patients/invalid$id!with*spaces` or a >128 char document ID.
7. **Temporal Forgery**: Creating a patient with backdated `createdAt` instead of `request.time`.
8. **Immutable MRN Tampering**: Updating `patients/pat-1` to alter `mrn` or `ownerId`.
9. **Terminal State Bypass (Encounter)**: Updating an `encounters/enc-1` whose existing `status` is `'Completed'` to `'In Progress'` or modifying `assessmentNote`.
10. **Terminal State Bypass (Lab Order)**: Updating a `labOrders/lab-1` whose existing `status` is `'Resulted'` to alter `resultValue`.
11. **Unbounded Array / Type Poisoning**: Creating `patients/pat-4` with `allergies: [12345]` (non-string) or 20 allergy entries (`> 15`).
12. **Blanket List Query Scraping**: Attempting `getDocs(collection(db, 'patients'))` without filtering `where('ownerId', '==', request.auth.uid)`.
