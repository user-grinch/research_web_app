import React, { useEffect, useRef, useState } from 'react';
import { bufferEvent, flushEvents } from '../services/eventBuffer';
import { performanceNow } from '../utils/time';
import { saveMetrics } from '../utils/metrics';
import { ChevronRight, ArrowLeft, Folder, FileText, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuNode {
    id: string;
    label: string;
    isTarget?: boolean;
    children?: MenuNode[];
}

const EASY_MAZE: MenuNode = {
    id: 'root', label: 'Systems', children: [
        { id: 'settings', label: 'Configuration', children: [
            { id: 'display', label: 'Visual Interface' },
            { id: 'audio', label: 'Audio Frequency', isTarget: true }
        ]},
        { id: 'profile', label: 'User Protocol' }
    ]
};

const HARD_MAZE: MenuNode = {
    id: 'root', label: 'Mainframe', children: [
        { id: 'settings', label: 'System Access', children: [
            { id: 'display', label: 'Display Buffer', children: [{id: 'brightness', label: 'Luminance'}] },
            { id: 'audio', label: 'Audio Out' },
            { id: 'advanced', label: 'Secure Subsystem', children: [
              {id: 'dev', label: 'Developer Logs'}, 
              {id: 'target', label: 'Target Authorization', isTarget: true}
            ]}
        ]},
        { id: 'profile', label: 'Security Crypt', children: [{id: 'security', label: 'Encryption Key'}] },
        { id: 'help', label: 'Internal Documentation' }
    ]
};

import { useUI } from '../context/UIContext';

export default function NavigationMazeGame({ sessionId, stage, onComplete }: { sessionId: string, stage: 'easy' | 'hard', onComplete: () => void }) {
    const { uiState } = useUI();
    const maze = stage === 'easy' ? EASY_MAZE : HARD_MAZE;
    
    const [path, setPath] = useState<MenuNode[]>([maze]);
    const startRef = useRef(performanceNow());
    const lastNavTsRef = useRef(performanceNow());

    const metricsRef = useRef({
        wrongNavigationCount: 0,
        backButtonCount: 0,
        selectionTimes: [] as number[],
        routeSequence: ['root']
    });

    useEffect(() => {
        const completeTimeout = setTimeout(() => {
            finishStage();
        }, 15000);

        return () => clearTimeout(completeTimeout);
    }, [stage, sessionId]);

    const finishStage = async (foundTarget = false) => {
        const now = performanceNow();
        const completionTimeMs = now - startRef.current;
        const m = metricsRef.current;

        const confusion = Math.min(1, (m.wrongNavigationCount + m.backButtonCount) / 5);

        const derived = {
            wrong_navigation_count: m.wrongNavigationCount,
            back_button_count: m.backButtonCount,
            task_completion_time_ms: completionTimeMs,
            avg_menu_selection_time_ms: m.selectionTimes.length > 0 ? m.selectionTimes.reduce((a,b)=>a+b,0)/m.selectionTimes.length : 0,
            navigation_confusion: confusion,
            route_sequence: m.routeSequence,
            found_target: foundTarget,
            ui_scale: uiState.scale
        };

        await saveMetrics(sessionId, `nav_maze_${stage}`, derived);
        await flushEvents(sessionId);
        onComplete();
    };

    const currentNode = path[path.length - 1];

    const handleSelect = (node: MenuNode) => {
        const now = performanceNow();
        const selectionTime = now - lastNavTsRef.current;
        
        const m = metricsRef.current;
        m.selectionTimes.push(selectionTime);
        m.routeSequence.push(node.id);
        
        if (!node.children && !node.isTarget) {
            m.wrongNavigationCount++;
            bufferEvent(sessionId, {
                game_id: 'nav_maze',
                event_type: 'wrong_nav',
                payload: { 
                  screen_id: node.id, 
                  parent_id: currentNode.id,
                  selection_time_ms: selectionTime,
                  ui_scale: uiState.scale,
                  stage 
                },
                client_ts: Date.now()
            });
        }

        bufferEvent(sessionId, {
            game_id: 'nav_maze',
            event_type: 'nav_select',
            payload: { 
              from_screen: currentNode.id, 
              to_screen: node.id, 
              selection_ts: now, 
              selection_time_ms: selectionTime,
              is_folder: !!node.children,
              is_target: !!node.isTarget,
              ui_scale: uiState.scale,
              stage 
            },
            client_ts: Date.now()
        });

        lastNavTsRef.current = now;

        if (node.isTarget) {
            finishStage(true);
        } else if (node.children) {
            setPath([...path, node]);
        }
    };

    const handleBack = () => {
        if (path.length <= 1) return;
        
        const now = performanceNow();
        const m = metricsRef.current;
        m.backButtonCount++;
        m.routeSequence.push('back');

        bufferEvent(sessionId, {
            game_id: 'nav_maze',
            event_type: 'back_press',
            payload: { 
              screen_id: currentNode.id, 
              ts: now, 
              path_depth: path.length,
              ui_scale: uiState.scale,
              stage 
            },
            client_ts: Date.now()
        });

        lastNavTsRef.current = now;
        setPath(path.slice(0, -1));
    };

    const targetLabel = stage === 'easy' ? 'Audio Frequency' : 'Target Authorization';

    return (
        <div className="absolute inset-0 bg-slate-950 text-white flex flex-col pt-16 select-none overflow-hidden">
            <div className="p-6 glass flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  {path.length > 1 && (
                      <motion.button 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={handleBack} 
                        className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 active:scale-90 transition-all"
                      >
                          <ArrowLeft size={20} />
                      </motion.button>
                  )}
                  <div>
                    <div className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Current Directory</div>
                    <h2 className="text-xl font-bold">{currentNode.label}</h2>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-white/5">
                  <Search size={14} className="text-slate-500" />
                  <span className="text-xs text-slate-400 font-mono italic">Searching for: {targetLabel}</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 relative">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentNode.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {currentNode.children?.map(child => (
                        <button 
                            key={child.id}
                            onClick={() => handleSelect(child)}
                            style={{ padding: `${1.25 * uiState.scale}rem` }}
                            className="w-full flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/60 active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-slate-800 rounded-xl text-slate-400 group-hover:text-blue-400 transition-colors">
                                {child.children ? <Folder size={20} /> : <FileText size={20} />}
                              </div>
                              <span className="text-lg font-medium text-slate-200">{child.label}</span>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                    {!currentNode.children && !currentNode.isTarget && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-600 opacity-50 grayscale">
                            <Folder size={48} className="mb-4 stroke-[1px]" />
                            <div className="text-sm font-mono tracking-widest uppercase">Directory Empty</div>
                        </div>
                    )}
                  </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-4 bg-slate-900/30 border-t border-white/5 text-center">
               <p className="text-[10px] text-slate-500 uppercase tracking-widest">Navigation Latency and Error Trace Enabled</p>
            </div>
        </div>
    );
}
