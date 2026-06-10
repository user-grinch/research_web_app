"use client";

import React, { useState, useEffect } from "react";
import OnboardingForm from "../components/OnboardingForm";
import GameLauncher from "../components/GameLauncher";
import SessionSummary from "../components/SessionSummary";
import { signIn } from "../services/firebase";
import { createSession } from "../services/sessionStore";

import { UIProvider } from "../context/UIContext";

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<"onboarding" | "games" | "summary">(
    "onboarding",
  );

  console.log("App State:", { userId, step, sessionId });

  useEffect(() => {
    // Authenticate anonymously on load
    signIn()
      .then((user) => {
        console.log("Authenticated user:", user.uid);
        setUserId(user.uid);
      })
      .catch((err) => {
        console.error("Auth init failed", err);
      });
  }, []);

  const handleOnboardingComplete = async () => {
    console.log("handleOnboardingComplete started for user:", userId);
    if (!userId) {
      console.warn("No userId found in handleOnboardingComplete");
      return;
    }
    try {
      console.log("Creating session...");
      const newSessionId = await createSession(userId);
      console.log("Session created with ID:", newSessionId);
      setSessionId(newSessionId);
      setStep("games");
    } catch (error: any) {
      console.error("Session creation failed", error);
      alert(`Failed to create session. Error: ${error?.message || "Unknown error"}`);
    }
  };

  const handleGamesComplete = () => {
    setStep("summary");
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-slate-500 text-center">Initializing Secure<br/>Handshake...</span>
        </div>
      </div>
    );
  }

  return (
    <UIProvider>
      <div className="h-screen w-screen bg-[#020617] overflow-hidden relative">
        {step === "onboarding" && (
          <OnboardingForm userId={userId} onComplete={handleOnboardingComplete} />
        )}
        {step === "games" && sessionId && (
          <GameLauncher sessionId={sessionId} onComplete={handleGamesComplete} />
        )}
        {step === "summary" && sessionId && (
          <SessionSummary sessionId={sessionId} />
        )}
      </div>
    </UIProvider>
  );
}
