import React, { useState } from "react";
import { db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Heart, PenTool, Cake, User, Shield, Info } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

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
        setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 5000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      await onComplete();
    } catch (error: any) {
      alert(`Something went wrong: ${error?.message || "Please try again"}`);
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
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-2">
              <h2 className="text-3xl font-semibold text-white tracking-tight">Welcome.</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Let's explore how you interact with your device. It only takes a few minutes.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2 text-sky-400">
                <User size={18} />
                <label className="text-sm font-medium uppercase tracking-wider opacity-80">How should we call you?</label>
              </div>
              <input
                autoFocus
                required
                type="text"
                className="w-full p-5 rounded-3xl bg-slate-900/50 border border-slate-800 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/10 outline-none transition-all text-xl placeholder:text-slate-700"
                placeholder="Name or nickname"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </motion.div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-2">
              <h2 className="text-2xl font-semibold text-white tracking-tight">Tell us a bit about yourself.</h2>
              <p className="text-slate-400 leading-relaxed">
                This helps us understand how different hands and bodies move.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Cake size={18} />
                  <label className="text-sm font-medium uppercase tracking-wider opacity-80">Age</label>
                </div>
                <input
                  required
                  type="number"
                  placeholder="25"
                  className="w-full p-5 rounded-3xl bg-slate-900/50 border border-slate-800 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/10 outline-none transition-all text-xl"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Activity size={18} />
                  <label className="text-sm font-medium uppercase tracking-wider opacity-80">Weight (kg)</label>
                </div>
                <input
                  required
                  type="number"
                  placeholder="70"
                  className="w-full p-5 rounded-3xl bg-slate-900/50 border border-slate-800 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/10 outline-none transition-all text-xl"
                  value={formData.weight_kg_approx}
                  onChange={(e) => setFormData({ ...formData, weight_kg_approx: e.target.value })}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 text-sky-400">
                <PenTool size={18} />
                <label className="text-sm font-medium uppercase tracking-wider opacity-80">Which hand do you use most?</label>
              </div>
              <div className="flex gap-3">
                {['left', 'right'].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFormData({ ...formData, dominant_hand: h })}
                    className={`flex-1 p-5 rounded-3xl border-2 font-semibold capitalize transition-all duration-300 ${
                      formData.dominant_hand === h 
                        ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-lg shadow-sky-400/20' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-2">
              <h2 className="text-2xl font-semibold text-white tracking-tight">Your privacy is our priority.</h2>
              <p className="text-slate-400 leading-relaxed">
                We only collect what we need to improve the experience.
              </p>
            </motion.div>

            {/* Trust Card */}
            <motion.div variants={itemVariants} className="glass p-6 rounded-[2rem] border border-white/5 space-y-4 bg-white/5">
              <div className="flex items-center gap-3 text-sky-400 mb-2">
                <Heart size={20} fill="currentColor" className="opacity-20" />
                <span className="font-semibold text-sky-400">Our commitment to you</span>
              </div>
              <div className="space-y-3">
                {[
                  "Your data is anonymous.",
                  "Only interaction patterns are stored.",
                  "No personal identifiers are ever linked."
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-300 leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.label variants={itemVariants} className="flex items-center gap-4 p-5 bg-sky-400/5 border border-sky-400/10 rounded-3xl cursor-pointer group transition-all hover:bg-sky-400/10">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer appearance-none w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 checked:bg-sky-400 checked:border-sky-300 transition-all cursor-pointer"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                />
                <Check size={14} className="absolute left-1.5 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                I understand and I'm ready to begin.
              </span>
            </motion.label>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative">
        {/* Progress Bar */}
        <div className="absolute -top-12 left-0 w-full flex gap-3 px-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ease-out ${
                i <= step ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-slate-800'
              }`} 
            />
          ))}
        </div>

        <div className="glass p-8 sm:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden bg-slate-900/40 border border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none text-sky-400">
            <Heart size={280} />
          </div>

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          <div className="mt-12 flex gap-4">
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-8 py-5 rounded-3xl bg-slate-900/80 text-slate-500 font-bold hover:bg-slate-800 hover:text-slate-300 transition-all"
              >
                Back
              </button>
            )}
            <button
              disabled={loading || (step === 2 && !formData.consent)}
              onClick={nextStep}
              className={`flex-1 p-5 rounded-3xl font-bold tracking-wide text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                loading 
                  ? 'bg-slate-800 text-slate-600' 
                  : 'bg-sky-400 text-slate-950 hover:bg-sky-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-sky-400/20 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100'
              }`}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-600 border-t-slate-400 rounded-full" />
              ) : (
                <>
                  <span className="pb-0.5">{step === totalSteps - 1 ? 'Authorize & Begin' : 'Continue'}</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-10 text-center opacity-30">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.3em]">Privacy-First Interaction Research</p>
        </div>
      </div>
    </div>
  );
}
