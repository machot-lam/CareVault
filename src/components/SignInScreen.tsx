import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

export const SignInScreen: React.FC = () => {
  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete sign-in.';
      setErrorMessage(
        msg.includes('popup-closed-by-user')
          ? 'Sign-in window was closed before completion. Please try again.'
          : msg
      );
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:grid lg:grid-cols-12 lg:items-stretch">
      {/* Left Sign-In Workspace Column */}
      <div className="lg:col-span-6 flex flex-col justify-between px-8 py-10 sm:px-14 lg:px-16 bg-white border-b lg:border-b-0 lg:border-r border-slate-200">
        <div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">
            CareVault
          </span>
        </div>

        <div className="my-12 max-w-md">
          <p className="text-xs font-medium text-teal-800 tracking-wide mb-3">
            Patient Information Management System
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight text-balance mb-5">
            Structured clinical records built for focused patient care.
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mb-8">
            Manage master patient demographics, longitudinal vital signs, structured SOAP encounters, active prescriptions, and diagnostic lab workflows in one unified workspace.
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 border-y border-slate-200 mb-8 text-sm">
            <div>
              <div className="font-medium text-slate-900">Longitudinal Charts</div>
              <div className="text-slate-500 mt-0.5">MRN registry, allergies & vitals trends</div>
            </div>
            <div>
              <div className="font-medium text-slate-900">SOAP Encounters</div>
              <div className="text-slate-500 mt-0.5">Structured clinical notes with sign-off</div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Medication Orders</div>
              <div className="text-slate-500 mt-0.5">Dosage, route & status tracking</div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Diagnostics & Labs</div>
              <div className="text-slate-500 mt-0.5">STAT priority & abnormal result flags</div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <span>{signingIn ? 'Authenticating Clinician...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>Clinician-scoped Firestore security rules with verified identity enforcement.</span>
        </div>
      </div>

      {/* Right Architectural Clinical Visual Column */}
      <div className="lg:col-span-6 relative min-h-[320px] lg:min-h-screen bg-slate-900 overflow-hidden">
        {!imgFailed ? (
          <img
            src="/src/assets/images/clinic_sign_in_interior_1795789638552.jpg"
            alt="Sunlit modern outpatient medical clinic consultation suite"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950 flex items-center justify-center p-12">
            <div className="text-center text-slate-300">
              <div className="text-2xl font-semibold tracking-tight mb-2">CareVault Clinical Suite</div>
              <div className="text-sm text-slate-400">Outpatient & Inpatient Record Management</div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="text-xs font-medium text-teal-300 tracking-wide mb-1">
            Clinical Operations Workspace
          </div>
          <div className="text-lg font-medium text-white">
            Unified inpatient telemetry and outpatient continuity of care.
          </div>
        </div>
      </div>
    </div>
  );
};
