import React, { useState, useEffect } from "react";
import TapAccuracyGame from "./TapAccuracyGame";
import ThumbZoneGame from "./ThumbZoneGame";
import TypingGame from "./TypingGame";
import NavigationMazeGame from "./NavigationMazeGame";
import ScrollSearchGame from "./ScrollSearchGame";
import { TRANSITION_DURATION_MS } from "../utils/config";
import { db } from "../services/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Zap, Beaker } from "lucide-react";

type StageType = "easy" | "hard";
interface GameSequence {
  id: string;
  Component: React.ComponentType<any>;
  stage: StageType;
  title: string;
}

const SEQUENCE: GameSequence[] = [
  { id: "tap", Component: TapAccuracyGame, stage: "easy", title: "Target Precision (α)" },
  { id: "tap", Component: TapAccuracyGame, stage: "hard", title: "Target Precision (β)" },
  { id: "thumb", Component: ThumbZoneGame, stage: "easy", title: "Kinetic Range (α)" },
  { id: "thumb", Component: ThumbZoneGame, stage: "hard", title: "Kinetic Range (β)" },
  { id: "typing", Component: TypingGame, stage: "easy", title: "Semantic Throughput (α)" },
  { id: "typing", Component: TypingGame, stage: "hard", title: "Semantic Throughput (β)" },
  { id: "nav", Component: NavigationMazeGame, stage: "easy", title: "Neural Pathing (α)" },
  { id: "nav", Component: NavigationMazeGame, stage: "hard", title: "Neural Pathing (β)" },
  { id: "scroll", Component: ScrollSearchGame, stage: "easy", title: "Visual Scanning (α)" },
  { id: "scroll", Component: ScrollSearchGame, stage: "hard", title: "Visual Scanning (β)" },
];

export default function GameLauncher({
  sessionId,
  onComplete,
}: {
  sessionId: string;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inTransition, setInTransition] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [appliedUi, setAppliedUi] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const sessionRef = doc(db, `sessions/${sessionId}`);
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (
          data.recommended_ui &&
          data.recommended_ui !== "Default_UI" &&
          data.recommended_ui !== appliedUi
        ) {
          setRecommendation(data.recommendation_details);
          setShowBanner(true);
        }
        if (data.applied_ui !== appliedUi) {
          setAppliedUi(data.applied_ui);
        }
      }
    });
    return () => unsubscribe();
  }, [sessionId, appliedUi]);

  const handleApplyRecommendation = async () => {
    if (!recommendation) return;
    setShowBanner(false);
    const sessionRef = doc(db, `sessions/${sessionId}`);
    await updateDoc(sessionRef, { applied_ui: recommendation.label });
  };

  const [showBriefing, setShowBriefing] = useState(true);

  useEffect(() => {
    if (currentIndex === 0) setShowBriefing(true);
  }, [currentIndex]);

  const handleStartStage = () => {
    setShowBriefing(false);
  };

  const handleStageComplete = () => {
    if (currentIndex < SEQUENCE.length - 1) {
      setInTransition(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setInTransition(false);
        setShowBriefing(true); // Show briefing for the next stage
      }, TRANSITION_DURATION_MS);
    } else {
      onComplete();
    }
  };

  const getBriefingContent = (id: string) => {
    switch (id) {
      case 'tap': return "Rapidly tap target circles as they appear. Precision and speed are both tracked.";
      case 'thumb': return "Tap the highlighted zones. This maps your comfortable thumb-reach radius.";
      case 'typing': return "Type the presented phrase exactly as shown to measure input throughput.";
      case 'nav': return "Find the specific system directory. Tests cognitive navigation efficiency.";
      case 'scroll': return "Scan the data stream and identify specific critical fragments.";
      default: return "";
    }
  };

  const uiClassNames =
    appliedUi === "Large_Button_UI"
      ? "scale-110 origin-center"
      : appliedUi === "Accessibility_UI"
        ? "contrast-150 saturate-150"
        : appliedUi === "Large_Font_UI"
        ? "text-lg"
        : "";

  const currentGame = SEQUENCE[currentIndex];
  const GameComponent = currentGame.Component;

  return (
    <div className={`relative w-full h-full bg-slate-950 overflow-hidden transition-all duration-500 ${uiClassNames}`}>
      {/* Global Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
               <Beaker size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] leading-none mb-1">Telemetry Protocol</div>
              <h1 className="text-white font-black text-lg tracking-tight leading-none">{currentGame.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="px-5 py-2 glass rounded-2xl border-white/10 text-white font-mono text-sm font-bold shadow-2xl">
              {Math.round(((currentIndex + 1) / SEQUENCE.length) * 100)}%
            </div>
          </div>
      </div>

      <AnimatePresence mode="wait">
        {showBriefing ? (
          <motion.div 
            key="briefing"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950"
          >
            <div className="w-full max-w-md glass p-10 rounded-[2.5rem] text-center border-blue-500/20">
              <div className="w-20 h-20 bg-blue-600/20 rounded-3xl mx-auto mb-8 flex items-center justify-center text-blue-400">
                 <Zap size={32} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-4 italic underline decoration-2 underline-offset-8">Phase Objective</h2>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{currentGame.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-10">
                {getBriefingContent(currentGame.id)}
              </p>
              <button 
                onClick={handleStartStage}
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
              >
                Initialize Phase
              </button>
            </div>
          </motion.div>
        ) : inTransition ? (
          <motion.div 
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-40"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Zap size={64} className="text-blue-500 mx-auto mb-8 animate-pulse" />
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Stage Synchronized</h2>
              <p className="text-blue-400 font-mono text-xl tracking-widest opacity-50">PREPARING NEXT SEQUENCE...</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            <GameComponent
              sessionId={sessionId}
              stage={currentGame.stage}
              onComplete={handleStageComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
