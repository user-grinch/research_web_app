import React, { useEffect, useRef, useState } from 'react';
import { bufferEvent, flushEvents } from '../services/eventBuffer';
import { performanceNow } from '../utils/time';
import { saveMetrics } from '../utils/metrics';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, ChevronDown } from 'lucide-react';

interface Item {
    id: string;
    text: string;
    isTarget: boolean;
}

import { useUI } from '../context/UIContext';

export default function ScrollSearchGame({ sessionId, stage, onComplete }: { sessionId: string, stage: 'easy' | 'hard', onComplete: () => void }) {
    const { uiState } = useUI();
    const [items, setItems] = useState<Item[]>([]);
    const startRef = useRef(performanceNow());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const lastScrollTs = useRef(0);
    const lastScrollY = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const metricsRef = useRef({
        totalScrollCount: 0,
        totalScrollDistancePx: 0,
        velocities: [] as number[],
        foundTargets: 0,
        totalTargets: stage === 'easy' ? 3 : 5
    });

    useEffect(() => {
        const count = stage === 'easy' ? 100 : 200;
        const targets = stage === 'easy' ? 3 : 5;
        
        const newItems: Item[] = Array.from({length: count}).map((_, i) => ({
            id: `item_${i}`,
            text: `Entry #${i.toString().padStart(3, '0')} - DATA_SCAN_${Math.random().toString(36).substring(7).toUpperCase()}`,
            isTarget: false
        }));

        const step = Math.floor(count / (targets + 1));
        for(let i=1; i<=targets; i++) {
            const index = i * step + Math.floor(Math.random() * (step / 2));
            newItems[index] = {
                id: `target_${i}`,
                text: "CRITICAL_TARGET_DETECTION_FOUND",
                isTarget: true
            };
        }
        
        setItems(newItems);

        const completeTimeout = setTimeout(() => {
            finishStage();
        }, 15000);

        return () => clearTimeout(completeTimeout);
    }, [stage, sessionId]);

    const finishStage = async () => {
        const m = metricsRef.current;
        const now = performanceNow();
        const completionTimeMs = now - startRef.current;
        
        let stability = 0;
        if (m.velocities.length > 1) {
            const avg = m.velocities.reduce((a,b)=>a+b,0)/m.velocities.length;
            const variance = m.velocities.reduce((a,b)=>a+Math.pow(b-avg, 2),0)/(m.velocities.length - 1);
            stability = variance;
        }

        const derived = {
            total_scroll_count: m.totalScrollCount,
            total_scroll_distance_px: m.totalScrollDistancePx,
            avg_scroll_speed_px_per_ms: m.velocities.length > 0 ? m.velocities.reduce((a,b)=>a+b,0)/m.velocities.length : 0,
            scroll_stability: stability,
            time_to_find_targets_ms: completionTimeMs,
            found_targets: m.foundTargets,
            ui_scale: uiState.scale,
            stage
        };

        await saveMetrics(sessionId, `scroll_search_${stage}`, derived);
        await flushEvents(sessionId);
        onComplete();
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const now = performanceNow();
        const currentY = e.currentTarget.scrollTop;
        const scrollH = e.currentTarget.scrollHeight;
        const clientH = e.currentTarget.clientHeight;
        
        if (scrollTimeoutRef.current === null) {
            bufferEvent(sessionId, {
                game_id: 'scroll_search',
                event_type: 'scroll_start',
                payload: { 
                  current_y: currentY,
                  scroll_height: scrollH,
                  client_height: clientH,
                  ui_scale: uiState.scale,
                  stage 
                },
                client_ts: Date.now()
            });
        } else {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            bufferEvent(sessionId, {
                game_id: 'scroll_search',
                event_type: 'scroll_end',
                payload: { 
                  final_y: currentY,
                  ui_scale: uiState.scale,
                  stage 
                },
                client_ts: Date.now()
            });
            scrollTimeoutRef.current = null;
        }, 150);
        
        if (lastScrollTs.current !== 0) {
            const dt = now - lastScrollTs.current;
            const dy = Math.abs(currentY - lastScrollY.current);
            if (dt > 0) {
                const velocity = dy / dt;
                const m = metricsRef.current;
                m.totalScrollCount++;
                m.totalScrollDistancePx += dy;
                m.velocities.push(velocity);

                const maxScroll = scrollH - clientH;
                const overscroll = currentY <= 0 || currentY >= maxScroll;

                bufferEvent(sessionId, {
                    game_id: 'scroll_search',
                    event_type: 'scroll_event',
                    payload: { 
                      dy, 
                      y: currentY,
                      velocity_px_per_ms: velocity, 
                      overscroll_bool: overscroll, 
                      ui_scale: uiState.scale,
                      stage 
                    },
                    client_ts: Date.now()
                });
            }
        }
        
        lastScrollTs.current = now;
        lastScrollY.current = currentY;
    };

    const handleTargetFound = (item: Item, index: number) => {
        if (!item.isTarget || item.text === "ANALYSIS_COMPLETE") return;

        const now = performanceNow();
        const m = metricsRef.current;
        m.foundTargets++;

        bufferEvent(sessionId, {
            game_id: 'scroll_search',
            event_type: 'item_found',
            payload: { 
              item_id: item.id, 
              index, 
              found_ts: now, 
              time_since_stage_start: now - startRef.current,
              scroll_position: scrollContainerRef.current?.scrollTop,
              ui_scale: uiState.scale,
              stage 
            },
            client_ts: Date.now()
        });
        
        setItems(prev => {
            const n = [...prev];
            n[index] = {...n[index], text: "ANALYSIS_COMPLETE"};
            return n;
        });

        if (m.foundTargets >= m.totalTargets) {
            finishStage();
        }
    };

    return (
        <div className="absolute inset-0 bg-slate-950 flex flex-col pt-16 select-none overflow-hidden">
            <div className="p-6 glass flex items-center justify-between z-10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Search size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Scanner Active</div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Locate Critical Fragments</h2>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono">FRAGMENTS_REMAINING</div>
                    <div className="text-xl font-black text-white font-mono">{metricsRef.current.totalTargets - metricsRef.current.foundTargets}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                    <div className="text-xs font-bold text-emerald-400">{Math.round((metricsRef.current.foundTargets / metricsRef.current.totalTargets) * 100)}%</div>
                  </div>
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-2 scroll-smooth"
            >
                <div className="py-10 flex flex-col items-center justify-center text-slate-700 animate-pulse">
                  <ChevronDown size={32} />
                  <span className="text-[10px] font-mono mt-2 tracking-[0.3em]">BEGIN_SCROLL_SEQUENCE</span>
                </div>

                {items.map((item, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleTargetFound(item, idx)}
                        style={{ padding: `${1.5 * uiState.scale}rem` }}
                        className={`rounded-2xl border transition-all duration-300 font-mono text-sm cursor-pointer ${
                            item.isTarget && item.text !== "ANALYSIS_COMPLETE" 
                              ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/10' : 
                            item.text === "ANALYSIS_COMPLETE" 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 opacity-60' :
                              'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10 hover:bg-slate-900/60'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{item.text}</span>
                          {item.text === "ANALYSIS_COMPLETE" && <CheckCircle2 size={16} />}
                          {item.isTarget && item.text !== "ANALYSIS_COMPLETE" && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                        </div>
                    </motion.div>
                ))}

                <div className="py-20 text-center text-slate-800 text-[10px] font-mono tracking-widest uppercase">
                  End of Data Stream
                </div>
            </div>
            
            {/* Scroll Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900">
               <motion.div 
                 className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                 style={{ 
                   width: scrollContainerRef.current ? 
                   `${(scrollContainerRef.current.scrollTop / (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight)) * 100}%` : '0%' 
                 }}
               />
            </div>
        </div>
    );
}
