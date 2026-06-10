import React, { useState } from "react";
import { db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { User, Activity, Shield, ChevronRight, Check, AlertCircle } from "lucide-react";

export default function OnboardingForm({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => Promise<void> | void;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    height_ft: "",
    height_in: "",
    weight_kg_approx: "",
    dominant_hand: "right",
    consent: false,
  });

  const totalSteps = 3;

  const handleSubmit = async () => {
    if (!formData.consent) return;
    setLoading(true);

    try {
      let device_os = "Unknown";
      if (typeof window !== "undefined") {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) device_os = "Android";
        else if (/ipad|iphone|ipod/i.test(ua)) device_os = "iOS";
        else if (/windows/i.test(ua)) device_os = "Windows";
        else if (/mac/i.test(ua)) device_os = "Mac";
      }

      const ft = parseInt(formData.height_ft, 10) || 0;
      const inch = parseInt(formData.height_in, 10) || 0;
      const height_cm = Math.round((ft * 12 + inch) * 2.54);

      const userRef = doc(db, `users/${userId}`);
      
      const savePromise = setDoc(userRef, {
        name: formData.name,
        age: parseInt(formData.age, 10),
        height_cm: height_cm,
        weight_kg_approx: parseInt(formData.weight_kg_approx, 10),
        dominant_hand: formData.dominant_hand,
        device_os: device_os,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: serverTimestamp(),
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore write timed out after 5 seconds.")), 5000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      await onComplete();
    } catch (error: any) {
      alert(`Initialization Failed: ${error?.message || "Check connection"}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0 && !formData.name) return;
    if (step === 1 && (!formData.age || !formData.weight_kg_approx)) return;
    if (step < totalSteps - 1) setStep(step + 1);
    else handleSubmit();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <User size={24} />
              <h2 className="text-xl font-bold uppercase tracking-tighter">Basic Identity</h2>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Researcher Name / ID</label>
              <input
                autoFocus
                required
                type="text"
                className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 focus:border-blue-500 outline-none transition-all text-lg"
                placeholder="Enter identifier..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <p className="text-sm text-slate-500 italic">This will be used to tag your telemetry session.</p>
          </motion.div>
        );
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <Activity size={24} />
              <h2 className="text-xl font-bold uppercase tracking-tighter">Physical Profile</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Age</label>
                <input
                  required
                  type="number"
                  className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 focus:border-blue-500 outline-none transition-all"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight (kg)</label>
                <input
                  required
                  type="number"
                  className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 focus:border-blue-500 outline-none transition-all"
                  value={formData.weight_kg_approx}
                  onChange={(e) => setFormData({ ...formData, weight_kg_approx: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dominant Hand</label>
              <div className="flex gap-2">
                {['left', 'right'].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFormData({ ...formData, dominant_hand: h })}
                    className={`flex-1 p-4 rounded-2xl border font-bold capitalize transition-all ${
                      formData.dominant_hand === h ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-3 mb-4 text-orange-400">
              <Shield size={24} />
              <h2 className="text-xl font-bold uppercase tracking-tighter">Research Consent</h2>
            </div>
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Check size={14} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-400">High-resolution touch & scroll telemetry</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Check size={14} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-400">Device capability & OS metadata</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Check size={14} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-400">Real-time UI adaptation profiling</p>
              </div>
            </div>
            <label className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl cursor-pointer group">
              <input
                type="checkbox"
                className="w-6 h-6 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              />
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                I authorize the collection of interaction data for UI behavioral research.
              </span>
            </label>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative">
        {/* Progress Bar */}
        <div className="absolute -top-12 left-0 w-full flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        <div className="glass p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Activity size={240} />
          </div>

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          <div className="mt-12 flex gap-4">
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="p-4 rounded-2xl bg-slate-900 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Back
              </button>
            )}
            <button
              disabled={loading || (step === 2 && !formData.consent)}
              onClick={nextStep}
              className={`flex-1 p-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${
                loading ? 'bg-slate-800 text-slate-600' : 'bg-white text-slate-950 hover:bg-blue-50 shadow-xl active:scale-95'
              }`}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-white rounded-full" />
              ) : (
                <>
                  {step === totalSteps - 1 ? 'Authorize & Begin' : 'Next Phase'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em]">Neural Telemetry Pipeline v1.0.4</p>
        </div>
      </div>
    </div>
  );
}
