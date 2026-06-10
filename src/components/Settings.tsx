import React from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Laptop, Smartphone, Type, MousePointer2 } from 'lucide-react';

const UIOptions = [
  { id: 'Default_UI', label: 'Default Experience', icon: Laptop, desc: 'Standard layout and scaling' },
  { id: 'Large_Button_UI', label: 'Enhanced Targets', icon: MousePointer2, desc: 'Increased clickable area' },
  { id: 'Large_Font_UI', label: 'High Legibility', icon: Type, desc: 'Bold typography and larger text' },
  { id: 'Simplified_UI', label: 'Minimalist Mode', icon: Check, desc: 'Reduced cognitive complexity' },
  { id: 'One_Hand_Right_UI', label: 'Right-Hand Mode', icon: Smartphone, desc: 'Optimized for right-thumb reach' },
  { id: 'One_Hand_Left_UI', label: 'Left-Hand Mode', icon: Smartphone, desc: 'Optimized for left-thumb reach' },
  { id: 'Accessibility_UI', label: 'High Contrast', icon: Check, desc: 'Visual clarity boost' },
];

export default function Settings({ sessionId, currentAppliedUi, onClose }: { sessionId: string, currentAppliedUi: string | null, onClose: () => void }) {
  const { applyUIAdjustment, resetUI } = useUI();
  
  const handleApplyUi = async (uiId: string) => {
    const appliedValue = uiId === 'Default_UI' ? null : uiId;
    
    // Update Cloud
    await updateDoc(doc(db, `sessions/${sessionId}`), {
      applied_ui: appliedValue
    });

    // Apply Locally immediately
    if (appliedValue) applyUIAdjustment(uiId);
    else resetUI();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Adaptive Preferences</h2>
            <p className="text-slate-500 text-sm">Fine-tune your research environment</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {UIOptions.map(ui => {
            const isSelected = (currentAppliedUi === ui.id) || (ui.id === 'Default_UI' && !currentAppliedUi);
            const Icon = ui.icon;

            return (
              <button
                key={ui.id}
                onClick={() => handleApplyUi(ui.id)}
                className={`flex flex-col gap-3 p-5 rounded-3xl border text-left transition-all group ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-900 text-slate-500 group-hover:text-blue-400'}`}>
                    <Icon size={20} />
                  </div>
                  {isSelected && <Check size={16} />}
                </div>
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider">{ui.label}</div>
                  <div className={`text-[10px] mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{ui.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all"
        >
          Finalize Changes
        </button>
      </motion.div>
    </motion.div>
  );
}
