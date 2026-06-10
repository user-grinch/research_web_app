import React, { useEffect, useRef, useState } from 'react';
import { bufferEvent, flushEvents } from '../services/eventBuffer';
import { performanceNow } from '../utils/time';
import { saveMetrics } from '../utils/metrics';
import { motion, AnimatePresence } from 'framer-motion';

const ZONES = ['top_left', 'top_center', 'top_right', 'mid_left', 'mid_right', 'bottom_center'];

import { useUI } from '../context/UIContext';

export default function ThumbZoneGame({ sessionId, stage, onComplete }: { sessionId: string, stage: 'easy' | 'hard', onComplete: () => void }) {
  const { uiState } = useUI();
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const startRef = useRef(performanceNow());
  const promptTsRef = useRef(0);
  
  const metricsRef = useRef({
      leftZoneCount: 0,
      rightZoneCount: 0,
      topZoneCount: 0,
      bottomZoneCount: 0,
      timeToFirstTouchSum: 0,
      touchCount: 0,
      screenInfo: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
      }
  });

  useEffect(() => {
    const cycleZone = () => {
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
        setActiveZone(zone);
        promptTsRef.current = performanceNow();
    };
    
    cycleZone();
    const id = setInterval(cycleZone, 2000);
    
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
          left_zone_count: m.leftZoneCount,
          right_zone_count: m.rightZoneCount,
          top_zone_count: m.topZoneCount,
          bottom_zone_count: m.bottomZoneCount,
          avg_time_to_first_touch_ms: m.touchCount > 0 ? m.timeToFirstTouchSum / m.touchCount : 0,
          screen_width: m.screenInfo.width,
          screen_height: m.screenInfo.height,
          ui_scale: uiState.scale
      };
      await saveMetrics(sessionId, `thumb_zone_${stage}`, derived);
      await flushEvents(sessionId);
      onComplete();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const now = performanceNow();
    const timeToFirstTouch = now - promptTsRef.current;
    
    // Determine zone clicked
    let clickedZone = '';
    if (y < h/3) clickedZone = x < w/3 ? 'top_left' : (x < 2*w/3 ? 'top_center' : 'top_right');
    else if (y < 2*h/3) clickedZone = x < w/2 ? 'mid_left' : 'mid_right';
    else clickedZone = 'bottom_center';

    const success = clickedZone === activeZone;
    const palmEdge = y > h * 0.95 || y < h * 0.05 || x < w * 0.05 || x > w * 0.95;

    const m = metricsRef.current;
    m.touchCount++;
    m.timeToFirstTouchSum += timeToFirstTouch;
    
    if (clickedZone.includes('left')) m.leftZoneCount++;
    if (clickedZone.includes('right')) m.rightZoneCount++;
    if (clickedZone.includes('top')) m.topZoneCount++;
    if (clickedZone.includes('bottom')) m.bottomZoneCount++;

    bufferEvent(sessionId, {
        game_id: 'thumb_zone',
        event_type: 'touch',
        payload: { 
          x, 
          y, 
          zone_id: clickedZone, 
          active_target_zone: activeZone,
          time_to_first_touch_ms: timeToFirstTouch, 
          success_bool: success, 
          palm_edge: palmEdge, 
          pointer_type: e.pointerType,
          pressure: e.pressure,
          screen_width: w,
          screen_height: h,
          ui_scale: uiState.scale,
          stage 
        },
        client_ts: Date.now()
    });
    
    if(success) setActiveZone(null);
  };

  const getZoneStyle = (zone: string) => {
    switch(zone) {
      case 'top_left': return { top: 0, left: 0, width: '33.33%', height: '33.33%' };
      case 'top_center': return { top: 0, left: '33.33%', width: '33.33%', height: '33.33%' };
      case 'top_right': return { top: 0, left: '66.66%', width: '33.33%', height: '33.33%' };
      case 'mid_left': return { top: '33.33%', left: 0, width: '50%', height: '33.33%' };
      case 'mid_right': return { top: '33.33%', left: '50%', width: '50%', height: '33.33%' };
      case 'bottom_center': return { top: '66.66%', left: 0, width: '100%', height: '33.33%' };
      default: return {};
    }
  };

  return (
    <div 
      onPointerDown={handlePointerDown} 
      className="game-canvas absolute inset-0 bg-slate-950 touch-none select-none overflow-hidden"
      style={{
        padding: uiState.handMode === 'right' ? '0 0 0 10%' : (uiState.handMode === 'left' ? '0 10% 0 0' : '0')
      }}
    >
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
          backgroundSize: '100px 100px' 
        }} />

        {ZONES.map(zone => (
          <div 
            key={zone} 
            className="absolute border border-white/5 transition-all"
            style={{
              ...getZoneStyle(zone),
              transform: `scale(${uiState.scale})`,
              transformOrigin: 'center'
            }}
          >
            <AnimatePresence>
              {activeZone === zone && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className={`absolute inset-0 flex items-center justify-center ${stage === 'easy' ? 'bg-blue-500/20' : ''}`}
                >
                  {stage === 'hard' ? (
                    <div className="w-12 h-12 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/40 flex items-center justify-center animate-bounce">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : (
                    <div className="text-blue-400 font-black text-4xl opacity-50 uppercase tracking-tighter">TAP</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-600">
          ZONAL DISTRIBUTION TRACKING ACTIVE {uiState.handMode !== 'none' && `[MODIFIED_FOR_${uiState.handMode.toUpperCase()}_HAND]`}
        </div>
    </div>
  );
}
