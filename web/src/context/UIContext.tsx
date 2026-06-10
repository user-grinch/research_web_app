"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIState {
  scale: number;
  fontSize: number;
  highContrast: boolean;
  handMode: 'left' | 'right' | 'none';
  simplified: boolean;
}

interface UIContextType {
  uiState: UIState;
  applyUIAdjustment: (label: string) => void;
  resetUI: () => void;
}

const defaultState: UIState = {
  scale: 1.0,
  fontSize: 16,
  highContrast: false,
  handMode: 'none',
  simplified: false,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [uiState, setUiState] = useState<UIState>(defaultState);

  const applyUIAdjustment = (label: string) => {
    switch (label) {
      case 'Large_Button_UI':
        setUiState(prev => ({ ...prev, scale: 1.25 }));
        break;
      case 'Large_Font_UI':
        setUiState(prev => ({ ...prev, fontSize: 20 }));
        break;
      case 'Accessibility_UI':
        setUiState(prev => ({ ...prev, highContrast: true, scale: 1.1 }));
        break;
      case 'Simplified_UI':
        setUiState(prev => ({ ...prev, simplified: true }));
        break;
      case 'One_Hand_Right_UI':
        setUiState(prev => ({ ...prev, handMode: 'right' }));
        break;
      case 'One_Hand_Left_UI':
        setUiState(prev => ({ ...prev, handMode: 'left' }));
        break;
      case 'Adaptive_Navigation_UI':
        setUiState(prev => ({ ...prev, simplified: true }));
        break;
      default:
        setUiState(defaultState);
    }
  };

  const resetUI = () => setUiState(defaultState);

  return (
    <UIContext.Provider value={{ uiState, applyUIAdjustment, resetUI }}>
      <div 
        style={{ 
          fontSize: `${uiState.fontSize}px`,
          filter: uiState.highContrast ? 'contrast(1.5) saturate(1.2)' : 'none',
        }}
        className={`h-full w-full transition-all duration-300 ${uiState.simplified ? 'simplified-mode' : ''}`}
      >
        {children}
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
