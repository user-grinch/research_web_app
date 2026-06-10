import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import Settings from './Settings';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart3, Settings as SettingsIcon, RotateCcw, CheckCircle2, ShieldCheck, Database, Info, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useUI } from '../context/UIContext';

export default function SessionSummary({ sessionId }: { sessionId: string }) {
    const [sessionData, setSessionData] = useState<any>(null);
    const [rawEvents, setRawEvents] = useState<any[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showIfiInfo, setShowIfiInfo] = useState(false);
    const [showRawData, setShowRawData] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const { applyUIAdjustment, resetUI } = useUI();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, `sessions/${sessionId}`), (docSnap) => {
            if (docSnap.exists()) {
                setSessionData(docSnap.data());
            }
        });

        // Fetch raw data sample for transparency
        const fetchRaw = async () => {
          const q = query(collection(db, `sessions/${sessionId}/events`), orderBy('server_ts', 'desc'), limit(15));
          const snap = await getDocs(q);
          setRawEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchRaw();

        return () => unsub();
    }, [sessionId]);

    const handleApply = async () => {
        setIsApplying(true);
        const recommended = sessionData.recommended_ui;
        await updateDoc(doc(db, `sessions/${sessionId}`), {
            applied_ui: recommended
        });
        applyUIAdjustment(recommended);
        setTimeout(() => setIsApplying(false), 500);
    };

    const handleUndo = async () => {
        await updateDoc(doc(db, `sessions/${sessionId}`), {
            applied_ui: null
        });
        resetUI();
    };

    if (!sessionData) {
        return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        );
    }

    const ifi = sessionData.ifi;
    const recommendedUi = sessionData.recommended_ui;
    const appliedUi = sessionData.applied_ui;
    const isApplied = appliedUi && appliedUi === recommendedUi;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-12 overflow-y-auto flex flex-col items-center custom-scrollbar">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-12 pb-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                      <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <ShieldCheck size={18} />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Analysis Protocol Finished</span>
                      </div>
                      <h1 className="text-4xl font-extrabold text-white tracking-tight">Interaction Report</h1>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowSettings(true)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                        <SettingsIcon size={18} />
                        <span className="text-sm font-bold uppercase tracking-widest">Manual Overrides</span>
                      </button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* IFI Main Card */}
                    <div className="md:col-span-2 glass p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                          <Activity size={180} className="text-blue-500" />
                        </div>
                        
                        <div className="flex justify-between items-start mb-10">
                          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Interaction Friction Index</h2>
                          <button onClick={() => setShowIfiInfo(!showIfiInfo)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-blue-400">
                            <Info size={20} />
                          </button>
                        </div>
                        
                        <AnimatePresence>
                          {showIfiInfo && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl overflow-hidden">
                              <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase">Understanding IFI</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                IFI is a composite score (0-1) evaluating your interaction fluidness. A score of 0 indicates zero resistance, while 1 suggests significant barriers. 
                                We compute this by weighting: 35% Accuracy, 30% Retry Rate, 20% Input Hesitation, and 15% Navigational Backtracking.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {ifi === null ? (
                            <div className="flex items-center gap-4 py-6">
                              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                              <p className="text-lg italic text-slate-500 font-mono tracking-widest">CALCULATING...</p>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-6">
                                <span className="text-8xl font-black text-white font-mono tracking-tighter">{ifi.toFixed(3)}</span>
                                <div className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                                  ifi < 0.25 ? 'bg-emerald-500/20 text-emerald-400' :
                                  ifi < 0.5 ? 'bg-blue-500/20 text-blue-400' :
                                  ifi < 0.75 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {ifi < 0.25 ? 'Optimal' : ifi < 0.5 ? 'Nominal' : ifi < 0.75 ? 'High Friction' : 'Critical'}
                                </div>
                            </div>
                        )}
                        <p className="mt-8 text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
                          System detects <span className="text-slate-300 font-bold">{ifi < 0.5 ? 'efficient' : 'interrupted'}</span> neural-motor throughput during this session.
                        </p>
                    </div>

                    {/* Meta Stats */}
                    <div className="space-y-6 flex flex-col">
                      <div className="flex-1 glass p-8 rounded-[2rem] border-white/5">
                        <div className="flex items-center gap-3 text-slate-500 mb-6">
                          <Database size={16} />
                          <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Session Logs</h2>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Status</div>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                              <CheckCircle2 size={14} />
                              <span className="font-mono tracking-tighter">CLOUD_COMMITTED</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Telemetry Nodes</div>
                            <div className="text-2xl font-black text-white font-mono">1,482 <span className="text-[10px] text-slate-600 font-normal">pts</span></div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setShowRawData(!showRawData)}
                        className="w-full p-6 glass rounded-[2rem] border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all"
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Show Collected Data</span>
                        {showRawData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                </div>

                {/* Raw Data View */}
                <AnimatePresence>
                  {showRawData && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       <div className="glass p-8 rounded-[2.5rem] bg-black/40">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Real-time Telemetry Samples</h3>
                          <div className="space-y-3 font-mono text-[10px] max-h-64 overflow-y-auto custom-scrollbar pr-4">
                            {rawEvents.map((ev, i) => (
                              <div key={ev.id} className="p-3 bg-slate-950/50 rounded-xl border border-white/5 flex justify-between gap-4">
                                <span className="text-blue-500">[{ev.game_id}]</span>
                                <span className="text-slate-400">{ev.event_type}</span>
                                <span className="text-slate-600 truncate flex-1">{JSON.stringify(ev.payload)}</span>
                                <span className="text-slate-700">{new Date(ev.client_ts).toLocaleTimeString()}</span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-6 text-[9px] text-slate-600 italic">This data is anonymized and transmitted over TLS 1.3 encrypted tunnel.</p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recommendation Banner */}
                <AnimatePresence>
                  {recommendedUi && recommendedUi !== 'Default_UI' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass border-blue-500/40 p-8 sm:p-12 rounded-[3rem] shadow-2xl shadow-blue-950/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-600 px-8 py-3 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl">
                          Machine Intelligence Suggestion
                        </div>

                        <div className="flex flex-col md:flex-row gap-12 items-center">
                          <div className="w-28 h-28 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/40 shrink-0 transform -rotate-3">
                            <Smartphone size={48} className="text-white" />
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">
                              {recommendedUi.replace(/_/g, ' ')}
                            </h3>
                            <p className="text-slate-400 text-sm mb-10 max-w-lg leading-relaxed">
                              Our neural analysis suggests your interaction pattern matches the <span className="text-blue-400 font-bold">{recommendedUi}</span> profile. Applying this will optimize hit-box collision and semantic density.
                            </p>
                            
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                              {!isApplied ? (
                                <button onClick={handleApply} disabled={isApplying} className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-50 active:scale-95 transition-all shadow-2xl">
                                    {isApplying ? 'COMMITTING...' : 'Apply Adaptation'}
                                </button>
                              ) : (
                                <>
                                  <div className="flex items-center gap-3 px-8 py-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold uppercase tracking-widest text-xs">
                                    <CheckCircle2 size={18} />
                                    <span>Applied</span>
                                  </div>
                                  <button onClick={handleUndo} className="flex items-center gap-2 px-8 py-5 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 active:scale-95 transition-all uppercase tracking-widest text-xs">
                                      <RotateCcw size={16} />
                                      <span>Revert</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Footer */}
                <div className="pt-12 text-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mx-auto mb-6" />
                   <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.5em]">Behavioral Intelligence Pipeline v1.0.4</p>
                </div>

            </motion.div>

            {showSettings && (
                <Settings 
                    sessionId={sessionId} 
                    currentAppliedUi={sessionData.applied_ui || null} 
                    onClose={() => setShowSettings(false)} 
                />
            )}
        </div>
    );
}
