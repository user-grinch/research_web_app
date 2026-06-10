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
  { id: "tap", Component: TapAccuracyGame, stage: "easy", title: "Accuracy Check" },
  { id: "tap", Component: TapAccuracyGame, stage: "hard", title: "Precision Check" },
  { id: "thumb", Component: ThumbZoneGame, stage: "easy", title: "Comfort Zone" },
  { id: "thumb", Component: ThumbZoneGame, stage: "hard", title: "Reach Test" },
  { id: "typing", Component: TypingGame, stage: "easy", title: "Typing Flow" },
  { id: "typing", Component: TypingGame, stage: "hard", title: "Input Rhythm" },
  { id: "nav", Component: NavigationMazeGame, stage: "easy", title: "Navigation" },
  { id: "nav", Component: NavigationMazeGame, stage: "hard", title: "System Pathing" },
  { id: "scroll", Component: ScrollSearchGame, stage: "easy", title: "Visual Scan" },
  { id: "scroll", Component: ScrollSearchGame, stage: "hard", title: "Focus Test" },
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
      case 'tap': return "Gently tap the targets as they appear. We're just looking at how you naturally interact with the screen.";
      case 'thumb': return "Please tap the areas that feel most comfortable for your thumb. This helps us understand your unique reach.";
      case 'typing': return "Type the words at your own pace. There's no rush; we're just learning about your typing style.";
      case 'nav': return "Let's find a folder together. This helps us see how you prefer to navigate through information.";
      case 'scroll': return "Take a look through the data and find the items we're looking for. It's like a quick search-and-find.";
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
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-2xl border-white/5">
          <Beaker size={18} className="text-sky-400" />
          <h1 className="text-white/80 font-medium text-sm tracking-tight">{currentGame.title}</h1>
        </div>
        
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl border-white/5">
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / SEQUENCE.length) * 100}%` }}
              className="h-full bg-sky-400"
            />
          </div>
          <span className="text-white/60 font-mono text-xs">
            {currentIndex + 1}/{SEQUENCE.length}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showBriefing ? (
          <motion.div 
            key="briefing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-8 bg-slate-950/40 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg glass p-12 rounded-[3rem] text-center border-white/10 shadow-2xl">
              <div className="w-16 h-16 bg-sky-400/10 rounded-2xl mx-auto mb-8 flex items-center justify-center text-sky-400">
                 <Zap size={28} />
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight mb-4">{currentGame.title}</h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-10 px-4">
                {getBriefingContent(currentGame.id)}
              </p>
              <button 
                onClick={handleStartStage}
                className="w-full py-5 bg-sky-400 text-slate-950 rounded-2xl font-bold tracking-tight text-lg shadow-lg shadow-sky-400/20 active:scale-95 transition-all cursor-pointer"
              >
                Let's Start
              </button>
            </div>
          </motion.div>
        ) : inTransition ? (
          <motion.div 
            key="transition"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-40"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Zap size={64} className="text-sky-400 mx-auto mb-8" />
              <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Great Job!</h2>
              <p className="text-sky-400/60 font-medium text-xl">Taking a moment to set up the next part...</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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

