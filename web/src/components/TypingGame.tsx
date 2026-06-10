import React, { useEffect, useRef, useState } from 'react';
import { bufferEvent, flushEvents } from '../services/eventBuffer';
import { performanceNow } from '../utils/time';
import { saveMetrics } from '../utils/metrics';
import { motion, AnimatePresence } from 'framer-motion';

const EASY_PHRASES = ["hello world", "quick brown fox", "jump over lazy dog"];
const HARD_PHRASES = ["The quick, brown fox jumps over 13 lazy dogs!", "Hello World; It's 2026. #AdaptiveUI"];

const getEditDistance = (a: string, b: string) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array.from({ length: b.length + 1 }, () => new Array(a.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            if (b.charAt(j - 1) === a.charAt(i - 1)) {
                matrix[j][i] = matrix[j - 1][i - 1];
            } else {
                matrix[j][i] = Math.min(
                    matrix[j - 1][i - 1] + 1,
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export default function TypingGame({ sessionId, stage, onComplete }: { sessionId: string, stage: 'easy' | 'hard', onComplete: () => void }) {
    const [targetPhrase, setTargetPhrase] = useState('');
    const [typedText, setTypedText] = useState('');
    const startRef = useRef(performanceNow());
    const metricsRef = useRef({ 
      backspaceCount: 0,
      keyLog: [] as any[]
    });

    useEffect(() => {
        const phrases = stage === 'easy' ? EASY_PHRASES : HARD_PHRASES;
        setTargetPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        startRef.current = performanceNow();

        const completeTimeout = setTimeout(() => {
            finishStage(typedText);
        }, 15000); // 15s for typing

        return () => clearTimeout(completeTimeout);
    }, [stage, sessionId]);

    const typedTextRef = useRef(typedText);
    useEffect(() => { typedTextRef.current = typedText; }, [typedText]);

    const finishStage = async (finalText?: string) => {
        const now = performanceNow();
        const completionTimeMs = now - startRef.current;
        const textToUse = finalText !== undefined ? finalText : typedTextRef.current;
        
        const errorCount = getEditDistance(targetPhrase, textToUse);
        const wpm = (textToUse.length / 5) / (completionTimeMs / 60000);

        const derived = {
            wpm: wpm,
            typing_error_count: errorCount,
            backspace_count: metricsRef.current.backspaceCount,
            typing_completion_time_ms: completionTimeMs,
            phrase_length: targetPhrase.length,
            typed_length: textToUse.length
        };

        bufferEvent(sessionId, {
            game_id: 'typing_race',
            event_type: 'completion',
            payload: { 
              typed_text: textToUse, 
              target_phrase: targetPhrase,
              completion_time_ms: completionTimeMs, 
              error_count: errorCount,
              wpm: wpm,
              key_log_summary: metricsRef.current.keyLog.length,
              stage 
            },
            client_ts: Date.now()
        });

        await saveMetrics(sessionId, `typing_race_${stage}`, derived);
        await flushEvents(sessionId);
        onComplete();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = performanceNow();
        const keyData = { 
          key: e.key, 
          ts: now, 
          time_since_start: now - startRef.current,
          text_length: typedText.length
        };
        metricsRef.current.keyLog.push(keyData);

        bufferEvent(sessionId, {
            game_id: 'typing_race',
            event_type: 'key_event',
            payload: { ...keyData, event_type: 'down', stage },
            client_ts: Date.now()
        });

        if (e.key === 'Backspace') {
            metricsRef.current.backspaceCount++;
            bufferEvent(sessionId, {
                game_id: 'typing_race',
                event_type: 'backspace_event',
                payload: { ts: now, stage },
                client_ts: Date.now()
            });
        }
    };

    const renderChar = (char: string, index: number) => {
      const typed = typedText[index];
      let color = 'text-slate-500';
      if (typed !== undefined) {
        color = typed === char ? 'text-emerald-400' : 'text-red-400 underline';
      }
      return <span key={index} className={`${color} transition-colors duration-200`}>{char}</span>;
    };

    return (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl glass p-10 rounded-3xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-6">Typing Fluency Test</h2>
                
                <div className="text-2xl font-mono leading-relaxed mb-10 p-6 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
                    {targetPhrase.split('').map(renderChar)}
                    {typedText.length < targetPhrase.length && (
                      <span className="inline-block w-3 h-6 bg-blue-500 ml-1 animate-pulse" />
                    )}
                </div>

                <input 
                    type="text" 
                    value={typedText}
                    onChange={(e) => {
                        setTypedText(e.target.value);
                        if (e.target.value === targetPhrase) {
                            finishStage(e.target.value);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full p-4 text-xl rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Type the phrase above..."
                />

                <div className="mt-8 flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>Errors: <span className={getEditDistance(targetPhrase, typedText.substring(0, targetPhrase.length)) > 0 ? 'text-red-400' : 'text-slate-500'}>{getEditDistance(targetPhrase, typedText.substring(0, targetPhrase.length))}</span></span>
                    <span>Progress: {Math.round((typedText.length / targetPhrase.length) * 100)}%</span>
                </div>
            </motion.div>
        </div>
    );
}
