import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

import { DEFENSE_STEPS } from '../defenseTourData.js';
export { DEFENSE_STEPS };

export default function DefenseTourCard({
  isOpen,
  onClose,
  currentStepIndex,
  onSelectStep,
  applyPreset,
  setSelectedEngineId,
  setPerturbSurrogate,
  setViewMode,
  canSplit = true,
  onOpenVerification,
  physicalState
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  const step = DEFENSE_STEPS[currentStepIndex] || DEFENSE_STEPS[0];
  const totalSteps = DEFENSE_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Execute step state configuration
  const handleApplyStep = (targetIdx) => {
    const s = DEFENSE_STEPS[targetIdx];
    if (!s) return;
    if (applyPreset && s.preset) applyPreset(s.preset);
    if (setSelectedEngineId && s.engineId) setSelectedEngineId(s.engineId);
    if (setPerturbSurrogate !== undefined) setPerturbSurrogate(s.perturb);
    if (setViewMode) {
      setViewMode(canSplit ? s.viewMode : '2D');
    }
  };

  // Automatically apply step state when currentStepIndex changes
  useEffect(() => {
    if (isOpen) {
      handleApplyStep(currentStepIndex);
    }
  }, [currentStepIndex, isOpen]);

  const handleNext = () => {
    if (!isLastStep) {
      onSelectStep(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      onSelectStep(currentStepIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="defense-tour-card"
      role="dialog"
      aria-labelledby="tour-step-title"
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-2xl bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden text-slate-100 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* 1. Header Toolbar */}
      <div className="px-4 py-2.5 bg-linear-to-r from-slate-900/90 via-cyan-950/40 to-slate-900/90 border-b border-cyan-500/30 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-xs">
            <GraduationCap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wider text-cyan-200 uppercase">
                Panel Defense Walkthrough
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Step {step.step} of {totalSteps}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal truncate max-w-sm">
              {step.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="tour-minimize-btn"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
            title={isMinimized ? 'Expand Defense Tour' : 'Minimize Defense Tour'}
          >
            {isMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            id="tour-close-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
            title="Exit Defense Tour"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Expanded Tour Content */}
      {!isMinimized && (
        <div className="p-4 flex flex-col gap-3 text-xs">
          
          {/* Step Metadata & Scientific Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 id="tour-step-title" className="font-bold text-sm text-white truncate">
                {step.title}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${step.badgeColor}`}
              >
                {step.badge}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
              {step.subtitle}
            </span>
          </div>

          {/* Academic Physical Rationale */}
          <p className="text-slate-300 leading-relaxed text-[12px] bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            {step.narrative}
          </p>

          {/* Key State Badge & Step Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Target State:</span>
              <span className="text-[10px] font-mono font-medium text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                {step.stateBadge}
              </span>
            </div>

            {/* Step 3 Optional Shortcut to Verification Modal */}
            {step.step === 3 && onOpenVerification && (
              <button
                id="tour-inspect-verification-btn"
                onClick={onOpenVerification}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
              >
                <ShieldAlert size={13} className="text-amber-400" />
                <span>Inspect Verification Modal</span>
              </button>
            )}
          </div>

          {/* Navigation & Stepper Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {DEFENSE_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => onSelectStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)]'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Jump to Step ${s.step}: ${s.title}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="tour-prev-btn"
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isFirstStep
                    ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                id="tour-reapply-btn"
                onClick={() => handleApplyStep(currentStepIndex)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition-all"
                title="Re-apply this step's preset, engine, and view mode"
              >
                <RotateCcw size={12} className="text-cyan-400" />
                <span>Re-Apply</span>
              </button>

              <button
                id="tour-next-btn"
                onClick={handleNext}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
              >
                <span>{isLastStep ? 'Complete Tour' : 'Next Step'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
