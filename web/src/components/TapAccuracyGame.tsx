import React, { useEffect, useRef, useState } from 'react';
import { bufferEvent, flushEvents } from '../services/eventBuffer';
import { performanceNow } from '../utils/time';
import { saveMetrics } from '../utils/metrics';
import { motion, AnimatePresence } from 'framer-motion';

interface Target {
  id: string;
  x: number;
  y: number;
  radius: number;
  spawnTs: number;
}

import { useUI } from '../context/UIContext';

export default function TapAccuracyGame({ sessionId, stage, onComplete }: { sessionId: string, stage: 'easy' | 'hard', onComplete: () => void }) {
  const { uiState } = useUI();
  const [targets, setTargets] = useState<Target[]>([]);
  const startRef = useRef(performanceNow());
  
  // Metrics state
  const metricsRef = useRef({
      totalTaps: 0,
      hits: 0,
      misses: 0,
      reactionTimes: [] as number[],
      lastTapTs: 0,
      doubleTaps: 0,
      screenInfo: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
        pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
      }
  });

  useEffect(() => {
    // spawn loop based on stage params
    const spawnInterval = stage === 'easy' ? 900 : 450;
    const baseRadius = stage === 'easy' ? 36 : 18;
    const radius = baseRadius * uiState.scale;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const marginX = w * 0.08;
    const marginY = h * 0.12; // More top margin for HUD

    const randomTarget = (r: number): Target => {
        return {
            id: Math.random().toString(36).substring(7),
            x: marginX + r + Math.random() * (w - 2 * marginX - 2 * r),
            y: marginY + r + Math.random() * (h - 2 * marginY - 2 * r),
            radius: r,
            spawnTs: performanceNow()
        };
    };

    const spawn = () => {
      const target = randomTarget(radius);
      setTargets([target]);
      
      bufferEvent(sessionId, {
        game_id: 'tap_accuracy',
        event_type: 'spawn',
        payload: { 
          target_id: target.id,
          target_x: target.x, 
          target_y: target.y, 
          target_radius: target.radius, 
          spawn_client_ts: target.spawnTs,
          screen_width: w,
          screen_height: h,
          stage 
        },
        client_ts: Date.now()
      });
    };
    
    spawn();
    const id = setInterval(spawn, spawnInterval);
    
    const completeTimeout = setTimeout(() => {
        clearInterval(id);
        finishStage();
    }, 10000);

    return () => {
        clearInterval(id);
        clearTimeout(completeTimeout);
    };
  }, [stage, sessionId]);

  const finishStage = async () => {
      const m = metricsRef.current;
      const derived = {
          total_taps: m.totalTaps,
          successful_taps: m.hits,
          miss_taps: m.misses,
          tap_accuracy: m.totalTaps > 0 ? m.hits / m.totalTaps : 0,
          avg_reaction_time_ms: m.reactionTimes.length > 0 ? m.reactionTimes.reduce((a,b)=>a+b, 0) / m.reactionTimes.length : 0,
          double_tap_count: m.doubleTaps,
          screen_width: m.screenInfo.width,
          screen_height: m.screenInfo.height
      };
      
      await saveMetrics(sessionId, `tap_accuracy_${stage}`, derived);
      await flushEvents(sessionId);
      onComplete();
  };

  const distance = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const tapX = e.clientX;
    const tapY = e.clientY;
    const now = performanceNow();
    
    const m = metricsRef.current;
    m.totalTaps++;

    const isDoubleTap = now - m.lastTapTs < 300;
    if (isDoubleTap) {
        m.doubleTaps++;
    }
    m.lastTapTs = now;

    const target = targets[0];
    let hit = false;
    let reactionTime = 0;
    let offsetX = 0;
    let offsetY = 0;

    if (target) {
        const dist = distance(tapX, tapY, target.x, target.y);
        hit = dist <= target.radius;
        reactionTime = now - target.spawnTs;
        offsetX = tapX - target.x;
        offsetY = tapY - target.y;
        
        if (hit) m.hits++;
        else m.misses++;
        
        m.reactionTimes.push(reactionTime);

        bufferEvent(sessionId, {
          game_id: 'tap_accuracy',
          event_type: 'tap',
          payload: { 
            target_id: target.id,
            tap_x: tapX, 
            tap_y: tapY, 
            target_x: target.x, 
            target_y: target.y, 
            target_radius: target.radius, 
            offset_x: offsetX,
            offset_y: offsetY,
            distance_from_center: dist,
            hit_bool: hit, 
            reaction_time_ms: reactionTime, 
            double_tap: isDoubleTap,
            pointer_type: e.pointerType,
            pressure: e.pressure,
            stage 
          },
          client_ts: Date.now()
        });
        
        if(hit) {
            setTargets([]); 
        }
    } else {
        // Tap on empty space
        m.misses++;
        bufferEvent(sessionId, {
          game_id: 'tap_accuracy',
          event_type: 'tap_empty',
          payload: { 
            tap_x: tapX, 
            tap_y: tapY, 
            double_tap: isDoubleTap,
            pointer_type: e.pointerType,
            stage 
          },
          client_ts: Date.now()
        });
    }
  };

  return (
    <div onPointerDown={handlePointerDown} className="game-canvas absolute inset-0 bg-slate-950 overflow-hidden touch-none select-none">
        {/* Background Grid for better depth */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />
        
        <AnimatePresence>
          {targets.map((t) => (
            <motion.div 
              key={t.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: t.x - t.radius,
                top: t.y - t.radius,
                width: t.radius * 2,
                height: t.radius * 2,
              }}
            >
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-red-500/50 target-glow animate-pulse-soft" />
              {/* Target core */}
              <div className="w-full h-full rounded-full bg-red-500 shadow-lg shadow-red-500/40 relative z-10 flex items-center justify-center">
                <div className="w-1/4 h-1/4 bg-white/40 rounded-full" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Feedback for taps */}
        <div className="absolute bottom-4 left-4 text-xs font-mono text-slate-500 flex gap-4">
          <span>HITS: <span className="text-emerald-400 font-bold">{metricsRef.current.hits}</span></span>
          <span>MISS: <span className="text-red-400 font-bold">{metricsRef.current.misses}</span></span>
          <span>ACC: <span className="text-blue-400 font-bold">{(metricsRef.current.totalTaps > 0 ? (metricsRef.current.hits / metricsRef.current.totalTaps * 100) : 0).toFixed(1)}%</span></span>
        </div>
    </div>
  );
}
